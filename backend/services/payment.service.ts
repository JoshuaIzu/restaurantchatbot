import { IOrderRepository } from '../repositories/order.repository';
import { IWalletRepository } from '../repositories/wallet.repository';
import { createPaymentProvider } from './payment.factory';
import { PaymentProvider, OrderItem, AppEvent } from '../types';
import { randomUUID } from 'crypto';
import { BotEngine } from './bot.engine';

export class PaymentService {
    constructor(
        private readonly orderRepo: IOrderRepository,
        private readonly walletRepo: IWalletRepository,
        private readonly botEngine: BotEngine,
    ) {}

    public async initiatePayment(params: {
        sessionId: string;
        items: OrderItem[];
        total: number;
        currency: string;
        provider: PaymentProvider;
        email?: string;
    }) {
        await this.walletRepo.findOrCreateBySessionId(params.sessionId, params.currency);
        const reference = randomUUID();

        const order = await this.orderRepo.createOrder({
            sessionId: params.sessionId,
            items: params.items,
            totalAmount: params.total,
            currency: params.currency,
            provider: params.provider,
            paymentReference: reference,
        });

        const provider = createPaymentProvider(params.provider);
        const init = await provider.initializeTransaction({
            amountMajor: params.total,
            email: params.email || `${params.sessionId}@anonymous.chat`,
            reference,
            currency: params.currency,
        });

        return { order, authorizationUrl: init.authorizationUrl };
    }

    public async fulfillSuccessfulPayment(reference: string): Promise<boolean> {
        const provider = createPaymentProvider('paystack');
        const verification = await provider.verifyTransaction(reference);

        if (verification.providerStatus !== 'success') return false;

        const order = await this.orderRepo.getByReference(reference);
        if (!order || order.status === 'COMPLETED') return false;

        try {
            await this.walletRepo.creditBalance(
                order.sessionId,
                order.totalAmount,
                reference,
                'PAYSTACK',
            );

            await this.walletRepo.debitBalance(
                order.sessionId,
                order.totalAmount,
                order.id,
            );

            await this.orderRepo.updateOrderStatus(reference, 'COMPLETED');

            await this.botEngine.notify('PAYMENT_SUCCESS' as AppEvent, {
                orderId: order.id,
                sessionId: order.sessionId,
                reference,
            });

            return true;
        } catch (error) {
            console.error(`Transaction flow failed for order ${reference}:`, error);
            await this.orderRepo.updateOrderStatus(reference, 'FAILED');
            await this.botEngine.notify('PAYMENT_FAILED' as AppEvent, { reference });
            return false;
        }
    }

    public async markPaymentFailed(reference: string): Promise<void> {
        await this.orderRepo.updateOrderStatus(reference, 'FAILED');
        await this.botEngine.notify('PAYMENT_FAILED' as AppEvent, { reference });
    }
}
