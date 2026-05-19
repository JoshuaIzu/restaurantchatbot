import { PrismaClient } from '../generated/prisma/client';
import { IOrderRepository, CreateOrderInput, Order } from './order.repository';
import { OrderItem, PaymentStatus } from '../types';

export class PrismaOrderRepository implements IOrderRepository {
    constructor(private readonly prisma: PrismaClient) {}

    public async createOrder(input: CreateOrderInput): Promise<Order> {
        const order = await this.prisma.order.create({
            data: {
                sessionId: input.sessionId,
                totalAmount: input.totalAmount,
                currency: input.currency,
                provider: input.provider,
                paymentReference: input.paymentReference,
                status: 'pending',
                items: {
                    create: input.items.map(item => ({
                        menuItem: BigInt(item.menuItemId),
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        category: item.category || 'general',
                    })),
                },
            },
        });
        return this.mapOrder(order);
    }

    public async getByReference(reference: string): Promise<Order | undefined> {
        const order = await this.prisma.order.findUnique({
            where: { paymentReference: reference },
            include: { items: true },
        });
        return order ? this.mapOrder(order) : undefined;
    }

    public async getOrdersBySessionId(sessionId: string): Promise<Order[]> {
        const orders = await this.prisma.order.findMany({
            where: { sessionId },
            include: { items: true },
            orderBy: { createdAt: 'desc' },
        });
        return orders.map(o => this.mapOrder(o));
    }

    public async updateOrderStatus(reference: string, status: PaymentStatus): Promise<Order | undefined> {
        try {
            const order = await this.prisma.order.update({
                where: { paymentReference: reference },
                data: { status },
            });
            return this.mapOrder(order);
        } catch {
            return undefined;
        }
    }

    private mapOrder(prismaOrder: any): Order {
        return {
            id: prismaOrder.id,
            sessionId: prismaOrder.sessionId,
            totalAmount: prismaOrder.totalAmount,
            currency: prismaOrder.currency,
            status: prismaOrder.status as PaymentStatus,
            provider: prismaOrder.provider as any,
            paymentReference: prismaOrder.paymentReference,
            items: prismaOrder.items?.map((item: any): OrderItem => ({
                menuItemId: String(item.menuItem),
                name: item.name,
                price: item.price,
                quantity: item.quantity,
            })),
            createdAt: prismaOrder.createdAt,
            updatedAt: prismaOrder.updatedAt,
        };
    }
}
