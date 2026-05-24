import { CommandStrategy } from './command.strategy';
import { SessionContext, BotResponse } from '../types';

export class ViewCartStrategy implements CommandStrategy {
    public async execute(context: SessionContext, _input: string): Promise<BotResponse> {
        if (!context.cart || context.cart.length === 0) {
            return {
                messages: ['Your cart is empty. Browse the menu to add items.'],
                newState: 'main_menu',
            };
        }

        let message = '🛒 Your Cart:\n';
        let total = 0;
        context.cart.forEach((item, index) => {
            const subtotal = item.price * item.quantity;
            total += subtotal;
            message += `${index + 1}. ${item.name} x${item.quantity} - ₦${subtotal.toLocaleString()}\n`;
        });
        message += `\nTotal: ₦${total.toLocaleString()}\n\nReply 99 to checkout, or continue adding items.`;

        return {
            messages: [message],
            newState: 'browsing_menu',
        };
    }
}
