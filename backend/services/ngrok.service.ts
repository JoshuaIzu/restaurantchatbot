import ngrok from '@ngrok/ngrok';

export class NgrokService {
    private static instance: NgrokService | null = null;
    private url: string | null = null;

    static getInstance(): NgrokService {
        if (!NgrokService.instance) {
            NgrokService.instance = new NgrokService();
        }
        return NgrokService.instance;
    }

    async start(port: number): Promise<string> {
        if (this.url) return this.url;

        const authToken = process.env.NGROK_AUTHTOKEN;
        if (!authToken) {
            console.warn('NGROK_AUTHTOKEN not set. Ngrok tunnel will not start.');
            return '';
        }

        try {
            const listener = await ngrok.connect({
                addr: port,
                authtoken: authToken,
            });

            this.url = listener.url() || '';
            console.log(`[Ngrok] Tunnel started: ${this.url}`);
            console.log(`[Ngrok] Webhook URL: ${this.url}/api/payment/webhook`);
            return this.url;
        } catch (error) {
            console.error('[Ngrok] Failed to start tunnel:', error);
            return '';
        }
    }

    getUrl(): string | null {
        return this.url;
    }

    async stop(): Promise<void> {
        if (this.url) {
            await ngrok.disconnect(this.url);
            this.url = null;
            console.log('[Ngrok] Tunnel stopped');
        }
    }
}
