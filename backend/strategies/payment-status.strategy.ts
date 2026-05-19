import { CommandStrategy } from './command.strategy';
import { SessionContext, BotResponse } from '../types';
import { IOrderRepository } from '../repositories/order.repository';

export class PaymentStatusStrategy implements CommandStrategy {
    constructor(private readonly orderRepo: IOrderRepository) {}

    public async execute(context: SessionContext, _input: string): Promise<BotResponse> {
        const orders = await this.orderRepo.getOrdersBySessionId(context.sessionId);
        const latest = orders.find(o => o.status === 'PENDING' || o.status === 'COMPLETED');

        if (!latest) {
            return {
                messages: ['No pending orders. Reply 1 to browse the menu.'],
                newState: 'main_menu',
            };
        }

        if (latest.status === 'COMPLETED') {
            return {
                messages: [`Payment confirmed! Order #${latest.id} is being prepared. Total: ${latest.currency === 'NGN' ? '₦' : '$'}${latest.totalAmount.toLocaleString()}.`],
                newState: 'main_menu',
            };
        }

        return {
            messages: ['Payment still processing. Check back in a moment or wait for confirmation.'],
            newState: 'awaiting_payment',
        };
    }
}