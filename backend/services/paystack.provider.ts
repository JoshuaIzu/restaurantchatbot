import axios from 'axios';
import { IPaymentProvider } from './payment.provider';

export class PaystackProvider implements IPaymentProvider {
    private readonly baseURL = 'https://api.paystack.co';
    private readonly secretKey = process.env.PAYSTACK_SECRET_KEY!;

    public async initializeTransaction(params: { amountMajor: number; email: string; reference: string; currency: string }) {
        const amountInKobo = params.amountMajor * 100;

        const response = await axios.post(`${this.baseURL}/transaction/initialize`, {
            email: params.email,
            amount: amountInKobo,
            reference: params.reference,
            currency: params.currency,
        }, {
            headers: { Authorization: `Bearer ${this.secretKey}` },
        });

        return {
            authorizationUrl: response.data.data.authorization_url,
            raw: response.data,
        };
    }

    public async verifyTransaction(reference: string) {
        try {
            const response = await axios.get(`${this.baseURL}/transaction/verify/${reference}`, {
                headers: { Authorization: `Bearer ${this.secretKey}` },
            });
            return {
                raw: response.data,
                providerStatus: response.data.data.status,
            };
        } catch {
            return { raw: null, providerStatus: 'failed' };
        }
    }

    public normalizeWebhookPayload(body: unknown) {
        const data = body as any;
        return {
            reference: data?.data?.reference,
            event: data?.event,
            succeeded: data?.event === 'charge.success',
        };
    }
}
