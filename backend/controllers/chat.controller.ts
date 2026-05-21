import { Request, Response } from 'express';
import { BotEngine } from '../services/bot.engine';
import { SessionContext, OrderItem } from "../types";
import { IChatRepository } from "../repositories/chat.repository"

declare module 'express-session' {
    interface SessionData {
        state: string;
        cart: OrderItem[];
    }
}

export class ChatController {
    constructor(private readonly botEngine: BotEngine, private readonly chatRepo: IChatRepository,) {}

    public async handleMessage(req: Request, res: Response): Promise<void> {
        try {
            const { message } = req.body;

            if(!message || typeof message !== 'string') {
                res.status(400).json({ error: 'Invalid message format' });
                return;
            }
            //express-session uses the device cookie to automatically map this to the correct Redis record
            const context: SessionContext = {
                sessionId: req.sessionID,
                state: req.session.state || 'main_menu',
                cart: req.session.cart || []
            }
            const messages: string[] = await this.botEngine.handleInput(context, message);

            try {
                await this.chatRepo.saveMessage({ sessionId: context.sessionId, sender: 'user', text: message });
                for (const botMsg of messages) {
                    await this.chatRepo.saveMessage({ sessionId: context.sessionId, sender: 'bot', text: botMsg });
                }
            } catch (err) {
                console.error('Failed to save chat history:', err);
            }


            req.session.state = context.state;
            req.session.cart = context.cart;

            req.session.save((err: Error | null): void => {
                if (err) {
                    console.error( 'Error saving session:', err);
                }
                res.status(200).json({ messages, state: context.state });
            });
        } catch (error) {
            const typedError = error as Error;
            console.error(`Chatbot Controller Error: ${typedError.message}`);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
      public async getHistory(req: Request, res: Response): Promise<void> {
                const sessionId = req.params.sessionId as string;
                const history = await this.chatRepo.getHistory(sessionId, 100);
                res.json(history);
            }

}