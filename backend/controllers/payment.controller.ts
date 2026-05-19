import { Request, Response } from 'express';
import crypto from 'crypto';
import { PaymentService } from '../services/payment.service';
import { createPaymentProvider } from '../services/payment.factory';

export class PaymentController {
    constructor(private readonly paymentService: PaymentService) {}

    public async handlePaystackWebhook(req: Request, res: Response): Promise<void> {
        console.log('[Webhook] Incoming Paystack webhook request');
        console.log('[Webhook] Headers:', JSON.stringify(req.headers));

        const secret = process.env.PAYSTACK_SECRET_KEY!;
        const signature = req.headers['x-paystack-signature'] as string;

        if (!signature) {
            console.warn('[Webhook] Missing x-paystack-signature header');
            res.status(400).send('Missing signature header');
            return;
        }

        const hash = crypto.createHmac('sha512', secret).update(req.body).digest('hex');
        console.log('[Webhook] Signature verification:', hash === signature ? 'PASSED' : 'FAILED');

        if (hash !== signature) {
            console.warn('[Webhook] Invalid Paystack signature detected');
            res.status(400).send('Invalid signature');
            return;
        }

        const payload = JSON.parse(req.body.toString());
        console.log('[Webhook] Payload event:', payload.event);
        console.log('[Webhook] Payload reference:', payload.data?.reference);

        res.sendStatus(200);

        try {
            const provider = createPaymentProvider('paystack');
            const normalized = provider.normalizeWebhookPayload(payload);
            console.log('[Webhook] Normalized:', JSON.stringify(normalized));

            if (normalized.succeeded && normalized.reference) {
                console.log('[Webhook] Processing successful payment for:', normalized.reference);
                const result = await this.paymentService.fulfillSuccessfulPayment(normalized.reference);
                console.log('[Webhook] Fulfillment result:', result ? 'SUCCESS' : 'FAILED');
            } else if (normalized.reference) {
                console.log('[Webhook] Processing failed payment for:', normalized.reference);
                await this.paymentService.markPaymentFailed(normalized.reference);
                console.log('[Webhook] Marked as failed');
            }
        } catch (error) {
            console.error('[Webhook] Error processing webhook payload:', error);
        }
    }

    public async initiatePayment(req: Request, res: Response): Promise<void> {
        try {
            const { sessionId, items, total, currency, provider, email } = req.body;
            if (!sessionId || !items || !total || !currency) {
                res.status(400).json({ error: 'sessionId, items, total, and currency are required' });
                return;
            }
            const result = await this.paymentService.initiatePayment({
                sessionId, items, total, currency,
                provider: provider || 'paystack',
                email,
            });
            res.status(201).json({
                authorizationUrl: result.authorizationUrl,
                reference: result.order.paymentReference,
                orderId: result.order.id,
            });
        } catch (error) {
            const err = error as Error;
            console.error('PaymentController.initiatePayment failed:', err);
            res.status(500).json({ error: 'Failed to initialize payment' });
        }
    }

    public async checkPaymentStatus(req: Request, res: Response): Promise<void> {
        try {
            const ref = req.params.ref as string;
            const order = await this.paymentService['orderRepo'].getByReference(ref);
            if (!order) {
                res.status(404).json({ error: 'Order not found' });
                return;
            }
            res.json({ status: order.status, reference: order.paymentReference, amount: order.totalAmount });
        } catch (error) {
            const err = error as Error;
            console.error('PaymentController.checkPaymentStatus failed:', err);
            res.status(500).json({ error: 'Failed to check payment status' });
        }
    }
}