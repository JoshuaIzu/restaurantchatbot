export interface IChatRepository {
    saveMessage(params: { sessionId: string; sender: 'user' | 'bot'; text: string }): Promise<void>;
    getHistory(sessionId: string, limit?: number): Promise<{ id: string; sender: string; text: string; createdAt: Date }[]>;
}