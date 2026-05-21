import { PrismaClient } from '../generated/prisma/client';
import { IChatRepository } from './chat.repository';

export class PrismaChatRepository implements IChatRepository {
    constructor(private readonly prisma: PrismaClient) {}

    public async saveMessage(params: { sessionId: string; sender: 'user' | 'bot'; text: string }): Promise<void> {
        await this.prisma.chatMessage.create({
            data: {
                sessionId: params.sessionId,
                sender: params.sender,
                text: params.text,
            },
        });
    }

    public async getHistory(sessionId: string, limit = 100): Promise<{ id: string; sender: string; text: string; createdAt: Date }[]> {
        const messages = await this.prisma.chatMessage.findMany({
            where: { sessionId },
            orderBy: { createdAt: 'asc' },
            take: limit,
        });
        return messages.map(m => ({
            id: m.id,
            sender: m.sender,
            text: m.text,
            createdAt: m.createdAt,
        }));
    }
}