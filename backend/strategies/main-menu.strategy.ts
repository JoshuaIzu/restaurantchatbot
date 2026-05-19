import { CommandStrategy } from './command.strategy';
import { SessionContext, BotResponse } from '../types';

export class MainMenuStrategy implements CommandStrategy {
    public async execute(_context: SessionContext, input: string): Promise<BotResponse> {
        if (input === '99') {
            return {
                messages: [],
                newState: 'checkout',
            };
        }
        if (input === '98') {
            return {
                messages: [],
                newState: 'order_history',
            };
        }
        if (input === 'status' || input === '97') {
            return { messages: [], newState: 'payment_status' };
        }

        if (input === '0') {
            return { messages: [], newState: 'cancel_order' };
        }
        return {
            messages: [`Welcome to Our Restaurant! Please select an option:
        1. Place an order
        99. Checkout order
        98. See order history
        97. Payment status
        0. Cancel order`],
            newState: 'main_menu',
        };
    }
}