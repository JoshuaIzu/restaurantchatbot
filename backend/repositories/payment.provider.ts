export interface IPaymentProvider {
    initializePayment(params: {
        amountMajor: number;
        email: string;
        reference: string;
        currency: string;
    }): Promise<{ authorizeUrl: string, raw: unknown}>;

    verifyTransaction(reference: string): Promise<{
        raw: unknown;
        providerStatus: string | undefined;
    }>;

    normalizeWebhookPayload(payload: unknown): {
        reference: string | undefined;
        event: string | undefined;
        succeeded: boolean;
    }
}
