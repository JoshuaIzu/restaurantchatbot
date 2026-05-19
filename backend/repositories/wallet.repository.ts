import { Wallet, Transaction } from "../types";


export interface IWalletRepository {
    findOrCreateBySessionId(sessionId: string, currency: string): Promise<Wallet>;
    creditBalance(sessionId: string, amount: number, reference: string, provider: string): Promise<{ wallet: Wallet; transaction: Transaction }>;
    debitBalance(sessionId: string, amount: number, orderId: string): Promise<{ wallet: Wallet; transaction: Transaction }>;
    getBySessionId(sessionId: string): Promise<Wallet | undefined>;
    getTransactionsBySessionId(sessionId: string): Promise<Transaction[]>;
}
