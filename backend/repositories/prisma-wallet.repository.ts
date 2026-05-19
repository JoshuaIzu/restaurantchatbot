import { PrismaClient } from '../generated/prisma/client';
import { IWalletRepository } from './wallet.repository';
import { Wallet, Transaction } from '../types';

export class PrismaWalletRepository implements IWalletRepository {
    constructor(private readonly prisma: PrismaClient) {}

    public async findOrCreateBySessionId(sessionId: string, currency: string): Promise<Wallet> {
        let wallet = await this.prisma.wallet.findUnique({ where: { sessionId } });
        if (!wallet) {
            wallet = await this.prisma.wallet.create({
                data: { sessionId, currency, balance: 0 }
            });
        }
        return this.mapWallet(wallet);
    }

    public async creditBalance(sessionId: string, amount: number, reference: string, provider: string): Promise<{ wallet: Wallet; transaction: Transaction }> {
        return this.prisma.$transaction(async (tx) => {
            const wallet = await tx.wallet.update({
                where: { sessionId },
                data: { balance: { increment: amount } }
            });

            const transaction = await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    amount,
                    currency: wallet.currency,
                    type: 'CREDIT',
                    status: 'COMPLETED',
                    provider,
                    paymentReference: reference,
                }
            });

            return { wallet: this.mapWallet(wallet), transaction: this.mapTransaction(transaction) };
        });
    }

    public async debitBalance(sessionId: string, amount: number, orderId: string): Promise<{ wallet: Wallet; transaction: Transaction }> {
        return this.prisma.$transaction(async (tx) => {
            const wallet = await tx.wallet.findUnique({ where: { sessionId } });

            if (!wallet || wallet.balance < amount) {
                throw new Error('Insufficient wallet balance');
            }

            const updatedWallet = await tx.wallet.update({
                where: { sessionId },
                data: { balance: { decrement: amount } }
            });

            const transaction = await tx.transaction.create({
                data: {
                    walletId: updatedWallet.id,
                    orderId,
                    amount,
                    currency: updatedWallet.currency,
                    type: 'DEBIT',
                    status: 'COMPLETED',
                    provider: 'INTERNAL_WALLET',
                    paymentReference: `wal_${Date.now()}_${orderId.substring(0, 8)}`,
                }
            });

            return { wallet: this.mapWallet(updatedWallet), transaction: this.mapTransaction(transaction) };
        });
    }

    public async getBySessionId(sessionId: string): Promise<Wallet | undefined> {
        const wallet = await this.prisma.wallet.findUnique({ where: { sessionId } });
        return wallet ? this.mapWallet(wallet) : undefined;
    }

    public async getTransactionsBySessionId(sessionId: string): Promise<Transaction[]> {
        const wallet = await this.prisma.wallet.findUnique({
            where: { sessionId },
            include: { transactions: { orderBy: { createdAt: 'desc' } } },
        });
        if (!wallet) return [];
        return wallet.transactions.map(t => this.mapTransaction(t));
    }

    private mapWallet(w: any): Wallet {
        return {
            id: w.id,
            sessionId: w.sessionId,
            balance: w.balance,
            currency: w.currency,
            createdAt: w.createdAt,
            updatedAt: w.updatedAt,
        };
    }

    private mapTransaction(t: any): Transaction {
        return {
            id: t.id,
            walletId: t.walletId,
            orderId: t.orderId,
            amount: t.amount,
            currency: t.currency,
            type: t.type,
            status: t.status,
            provider: t.provider,
            paymentReference: t.paymentReference,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
        };
    }
}
