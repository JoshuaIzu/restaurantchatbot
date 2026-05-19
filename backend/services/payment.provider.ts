export interface IPaymentProvider {
    initializeTransaction(params: {
        amountMajor: number;
        email: string;
        reference: string;
        currency: string;
    }): Promise<{ authorizationUrl: string; raw: unknown }>;

    verifyTransaction(reference: string): Promise<{
        raw: unknown;
        providerStatus: string | undefined;
    }>;

    normalizeWebhookPayload(body: unknown): {
        reference: string | undefined;
        event: string | undefined;
        succeeded: boolean;
    };
}