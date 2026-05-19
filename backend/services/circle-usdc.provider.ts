import { IPaymentProvider } from './payment.provider';

export class CircleUsdcProvider implements IPaymentProvider {
    public async initializeTransaction(): Promise<{ authorizationUrl: string; raw: unknown }> {
        throw new Error('Circle USDC provider not implemented yet');
    }

    public async verifyTransaction(): Promise<{ raw: unknown; providerStatus: string | undefined }> {
        throw new Error('Circle USDC provider not implemented yet');
    }

    public normalizeWebhookPayload(): { reference: string | undefined; event: string | undefined; succeeded: boolean } {
        return { reference: undefined, event: undefined, succeeded: false };
    }
}