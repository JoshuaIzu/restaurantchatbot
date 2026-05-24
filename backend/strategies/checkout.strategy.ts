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

        if (context.state === 'awaiting_schedule' || context.state === 'awaiting_payment') {
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

            context.cart = [];
            const symbol = currency === 'NGN' ? '₦' : '$';
            return {
                messages: [`Your total is ${symbol}${totalAmount.toLocaleString()}. Enter your email to proceed with payment.\n\nWant to schedule for later? Reply with minutes (e.g., 30) or 'cancel' to cancel.`],
                newState: 'awaiting_payment',
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
        if (input.toLowerCase() === 'cancel') {
            context.cart = [];
            context.pendingPayment = undefined;
            return {
                messages: ['Checkout cancelled. Returning to main menu.'],
                newState: 'main_menu',
            };
        }

        const minutes = parseInt(input);
        if (isNaN(minutes) || minutes <= 0) {
            const pending = context.pendingPayment;
            if (pending) {
                const symbol = pending.currency === 'NGN' ? '₦' : '$';
                return {
                    messages: [`Your total is ${symbol}${pending.total.toLocaleString()}. Enter your email to proceed with payment.\n\nWant to schedule for later? Reply with minutes (e.g., 30) or 'cancel' to cancel.`],
                    newState: 'awaiting_payment',
                };
            }
            return { messages: ['Checkout session expired. Returning to main menu.'], newState: 'main_menu' };
        }

        const pending = context.pendingPayment;
        if (!pending) {
            context.cart = [];
            return { messages: ['Checkout session expired. Returning to main menu.'], newState: 'main_menu' };
        }

        if (this.schedulerService) {
            const scheduledAt = new Date(Date.now() + minutes * 60000);
            await this.schedulerService.scheduleOrder(pending.orderId, scheduledAt);
        }

        context.cart = [];
        const symbol = pending.currency === 'NGN' ? '₦' : '$';
        return {
            messages: [`Order scheduled for ${new Date(Date.now() + minutes * 60000).toLocaleTimeString()}. Your total is ${symbol}${pending.total.toLocaleString()}. Enter your email to proceed with payment.`],
            newState: 'awaiting_payment',
        };
    }
}
