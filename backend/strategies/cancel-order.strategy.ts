import { CommandStrategy } from './command.strategy';
import { SessionContext, BotResponse } from '../types';

export class CancelOrderStrategy implements CommandStrategy {
    public async execute(context: SessionContext, _input: string): Promise<BotResponse> {
        if (!context.cart || context.cart.length === 0) {
            return {
                messages: ['Your cart is already empty.'],
                newState: 'main_menu',
            };
        }
        context.cart = [];
        return {
            messages: ['Your order has been cancelled. Reply 1 to start a new order.'],
            newState: 'main_menu',
        };
    }
}