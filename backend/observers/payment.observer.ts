import { Observer } from './event.observer';
import { AppEvent } from '../types';
import { Server } from 'socket.io';

export class PaymentObserver implements Observer {
    constructor(
        private readonly io: Server,
        private readonly sessionSocketMap: Map<string, string>,
    ) {}

    public async update(event: AppEvent, payload: unknown): Promise<void> {
        if (event === 'PAYMENT_SUCCESS') {
            const data = payload as { orderId: string; sessionId: string; reference: string };
            console.log(`[PaymentObserver] Payment successful for order ${data.orderId}, reference ${data.reference}`);

            const socketId = this.sessionSocketMap.get(data.sessionId);
            if (socketId) {
                this.io.to(socketId).emit('payment_success', {
                    message: 'Payment confirmed! Your order is being prepared.',
                    orderId: data.orderId,
                });
            }
        }

        if (event === 'PAYMENT_FAILED') {
            const data = payload as { reference: string; sessionId?: string };
            console.log(`[PaymentObserver] Payment failed for reference ${data.reference}`);

            if (data.sessionId) {
                const socketId = this.sessionSocketMap.get(data.sessionId);
                if (socketId) {
                    this.io.to(socketId).emit('payment_failed', {
                        message: 'Payment failed. Reply 99 to try again.',
                    });
                }
            }
        }
    }
}
