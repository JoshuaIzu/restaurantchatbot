import { CommandStrategy } from './command.strategy';
import { SessionContext, BotResponse } from '../types';
import { PaymentService } from '../services/payment.service';
import { SchedulerService } from '../services/scheduler.service';

export class CheckoutStrategy implements CommandStrategy {
    constructor(
        private readonly paymentService: PaymentService,
        private readonly schedulerService?: SchedulerService,
    ) {}

    public async execute(context: SessionContext, input: string): Promise<BotResponse> {
        if (!context.cart || context.cart.length === 0) {
            return {
                messages: ['Your cart is empty. Browse the menu to add items.'],
                newState: 'main_menu',
            };
        }

        if (context.state === 'awaiting_schedule') {
            return await this.processScheduleInput(context, input);
        }

        if (context.state !== 'checkout_payment_selection') {
            return {
                messages: ['How would you like to pay?\n1. Paystack (NGN)\n2. Circle USDC (USD)'],
                newState: 'checkout_payment_selection',
            };
        }

        if (input === '1') {
            return await this.processPaymentSelection(context, 'paystack', 'NGN');
        } else if (input === '2') {
            return await this.processPaymentSelection(context, 'circle_usdc', 'USD');
        }

        return {
            messages: ['Invalid selection. Reply 1 for Paystack (NGN) or 2 for Circle USDC (USD).'],
            newState: 'checkout_payment_selection',
        };
    }

    private async processPaymentSelection(context: SessionContext, provider: string, currency: string): Promise<BotResponse> {
        try {
            const totalAmount = context.cart.reduce((sum: number, item) => sum + (item.price * item.quantity), 0);

            const result = await this.paymentService.initiatePayment({
                sessionId: context.sessionId,
                items: context.cart,
                total: totalAmount,
                currency,
                provider: provider as any,
            });

            context.pendingPayment = {
                orderId: result.order.id,
                authorizationUrl: result.authorizationUrl,
                total: totalAmount,
                currency,
            };

            return {
                messages: ['Schedule for later? Reply with minutes (e.g., 30) or 0 for immediate.'],
                newState: 'awaiting_schedule',
            };
        } catch (error) {
            const typedError = error as Error;
            return {
                messages: [`Error initializing checkout: ${typedError.message}`],
                newState: 'main_menu',
            };
        }
    }

    private async processScheduleInput(context: SessionContext, input: string): Promise<BotResponse> {
        const minutes = parseInt(input);
        if (isNaN(minutes) || minutes < 0) {
            return {
                messages: ['Invalid input. Reply with minutes (e.g., 30) or 0 for immediate.'],
                newState: 'awaiting_schedule',
            };
        }

        const pending = context.pendingPayment;
        if (!pending) {
            return { messages: ['Session expired. Please start checkout again.'], newState: 'main_menu' };
        }

        if (minutes > 0 && this.schedulerService) {
            const scheduledAt = new Date(Date.now() + minutes * 60000);
            await this.schedulerService.scheduleOrder(pending.orderId, scheduledAt);
        }

        context.cart = [];
        const symbol = pending.currency === 'NGN' ? '₦' : '$';
        const scheduleMsg = minutes > 0
            ? `Order scheduled for ${new Date(Date.now() + minutes * 60000).toLocaleTimeString()}. `
            : '';

        return {
            messages: [`${scheduleMsg}Your total is ${symbol}${pending.total.toLocaleString()}. Click here to pay: ${pending.authorizationUrl}`],
            newState: 'awaiting_payment',
        };
    }
}
