import "dotenv/config";
import cors from 'cors';
import express, { Request, Response } from 'express';
import session from 'express-session';
import { createClient } from 'redis';
import { RedisStore } from 'connect-redis';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';
import { PrismaMenuRepository } from './repositories/prisma-menu.repository';
import { PrismaWalletRepository } from './repositories/prisma-wallet.repository';
import { PrismaOrderRepository } from './repositories/prisma-order.repository';
import { PrismaChatRepository } from './repositories/prisma-chat.repository';
import { ChatController } from "./controllers/chat.controller";
import { BotEngine } from "./services/bot.engine";
import { AdminMenuController } from './controllers/admin-menu.controller';
import { PaymentService } from './services/payment.service';
import { PaymentController } from './controllers/payment.controller';
import { CheckoutStrategy } from './strategies/checkout.strategy';
import { PaymentObserver } from './observers/payment.observer';
import { createServer } from 'http';
import { Server } from 'socket.io';
import {SchedulerService} from "./services/scheduler.service";
import { validateChat, validatePaymentInit } from './middleware/validator';
import path from 'path';

async function bootstrap() {
    const app = express();
    app.use(cors({
    origin: process.env.CORS_ORIGIN || 'https://restaurantchatbot-f116c9f47ce0.herokuapp.com',
    credentials: true
    }));

    app.use((req: Request, res: Response, next) => {
        if (req.path === '/api/payment/webhook') {
            next();
        } else {
            express.json()(req, res, next);
        }
    });

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const redisClient = createClient({
        url: redisUrl,
        socket: redisUrl.startsWith('rediss://') ? {
            tls: true,
            rejectUnauthorized: false
        } : undefined
    });

    redisClient.on('error', (err: Error) => console.error('Redis Client Error:', err));
    redisClient.on('connect', () => console.log('Successfully connected to Redis'));

    try {
        await redisClient.connect();
    } catch (error) {
        console.error('Failed to connect to Redis:', error);
        process.exit(1);
    }

    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret) {
        throw new Error('SESSION_SECRET environment variable is required');
    }

    app.use(
        session({
            store: new RedisStore({ client: redisClient }),
            secret: sessionSecret,
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000,
            },
        })
    );

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is required');
    }

    const adapter = new PrismaPg({ connectionString });
    const prisma = new PrismaClient({ adapter });
    const menuRepo = new PrismaMenuRepository(prisma);
    const walletRepo = new PrismaWalletRepository(prisma);
    const orderRepo = new PrismaOrderRepository(prisma);
    const botEngine = new BotEngine(menuRepo, orderRepo);
    const paymentService = new PaymentService(orderRepo, walletRepo, botEngine);
    const chatRepo = new PrismaChatRepository(prisma);
    const chatController = new ChatController(botEngine, chatRepo);
    const adminController = new AdminMenuController(menuRepo);
    const paymentController = new PaymentController(paymentService);
    const schedulerService = new SchedulerService(orderRepo, redisUrl);
    const checkoutStrategy = new CheckoutStrategy(paymentService, schedulerService);



    botEngine.registerStrategy('checkout', checkoutStrategy);
    botEngine.registerStrategy('checkout_payment_selection', checkoutStrategy);
    botEngine.registerStrategy('awaiting_schedule', checkoutStrategy);
    botEngine.registerStrategy('awaiting_payment', checkoutStrategy);

    const server = createServer(app);
    const io = new Server(server, {
        cors: { origin: '*' },
        connectionStateRecovery: {},
    });

    // Sync Express session with Socket.io
    io.engine.use(session({
        store: new RedisStore({ client: redisClient }),
        secret: sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: { httpOnly: true, secure: false, maxAge: 86400000 },
    }));

    const sessionSocketMap = new Map<string, string>();

    io.on('connection', (socket) => {
        const sessionId = socket.handshake.query.sessionId as string;
        if (sessionId) {
            sessionSocketMap.set(sessionId, socket.id);
        }

        socket.on('disconnect', () => {
            sessionSocketMap.delete(sessionId);
        });
    });

    botEngine.attach(new PaymentObserver(io, sessionSocketMap));
    app.get('/api/chat/history/:sessionId', (req, res) => chatController.getHistory(req, res));
    app.post('/api/chat', validateChat, (req: Request, res: Response) => chatController.handleMessage(req, res));
    app.use('/api/admin/menu', adminController.router);
    app.post('/api/payment/initialize', validatePaymentInit, (req: Request, res: Response) => paymentController.initiatePayment(req, res));
    app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), (req: Request, res: Response) => paymentController.handlePaystackWebhook(req, res));
    app.get('/api/payment/status/:ref', (req: Request, res: Response) => paymentController.checkPaymentStatus(req, res));
    app.get('/api/payment/callback', (req: Request, res: Response) => {
        const { reference, status } = req.query;
        console.log(`[Callback] Payment ${status} for reference ${reference}`);
        res.json({ reference, status, message: 'Payment processed. Check your chat for confirmation.' });
    });

    // Public menu endpoints
    app.get('/api/menu', async (_req: Request, res: Response) => {
        try {
            const items = await menuRepo.getAllItems();
            res.json(items);
        } catch (error) {
            console.error('MenuController.getAll failed:', error);
            res.status(500).json({ error: 'Failed to fetch menu' });
        }
    });
    app.get('/api/menu/:id', async (req: Request, res: Response) => {
        try {
            const id = req.params.id as string;
            const item = await menuRepo.getItemById(id);
            if (!item) {
                res.status(404).json({ error: 'Menu item not found' });
                return;
            }
            res.json(item);
        } catch (error) {
            console.error('MenuController.getOne failed:', error);
            res.status(500).json({ error: 'Failed to fetch menu item' });
        }
    });

    // Wallet & order history endpoints
    app.get('/api/wallet/:sessionId', async (req: Request, res: Response) => {
        try {
            const sessionId = req.params.sessionId as string;
            const wallet = await walletRepo.getBySessionId(sessionId);
            if (!wallet) {
                res.status(404).json({ error: 'Wallet not found' });
                return;
            }
            res.json(wallet);
        } catch (error) {
            console.error('WalletController.getBalance failed:', error);
            res.status(500).json({ error: 'Failed to fetch wallet' });
        }
    });
    app.get('/api/orders/:sessionId', async (req: Request, res: Response) => {
        try {
            const sessionId = req.params.sessionId as string;
            const orders = await orderRepo.getOrdersBySessionId(sessionId);
            res.json(orders);
        } catch (error) {
            console.error('OrderController.getHistory failed:', error);
            res.status(500).json({ error: 'Failed to fetch orders' });
        }
    });
    app.get('/api/transactions/:sessionId', async (req: Request, res: Response) => {
        try {
            const sessionId = req.params.sessionId as string;
            const transactions = await walletRepo.getTransactionsBySessionId(sessionId);
            res.json(transactions);
        } catch (error) {
            console.error('TransactionController.getHistory failed:', error);
            res.status(500).json({ error: 'Failed to fetch transactions' });
        }
    });

   if (process.env.NODE_ENV === 'production') {
        app.use(express.static(path.join(__dirname, '../frontend/dist')));
        app.get('*', (_req: Request, res: Response) => {
            res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
        });
    }

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log(`Restaurant ChatBot API running on port ${PORT}`);
    });

    setInterval(async () => {
        try {
            await prisma.$queryRaw`SELECT 1`;
        } catch { /* ignore */ }
    }, 240000); // Every 4 minutes

    process.on('SIGINT', async () => {
        console.log('Shutting down...');
        await io.close();
        await schedulerService.dispose();
        await redisClient.quit();
        await prisma.$disconnect();
        process.exit(0);
    });
}

bootstrap().catch(console.error);
