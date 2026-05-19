export type AppEvent = "PAYMENT_SUCCESS" | "PAYMENT_FAILED" | "ORDER_PLACED" |  "ORDER_CANCELLED" | "ORDER_DISPATCHED";
export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
export type PaymentProvider = "paystack" | "circle_usdc";

export interface OrderItem {
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    category?: string;
    modifier?: any;
}

export interface MenuItem {
    id: string;
    name: string;
    price: number;
    category: string;
    available: boolean;
}

export interface PendingPayment {
    orderId: string;
    authorizationUrl: string;
    total: number;
    currency: string;
}

export interface SessionContext {
    sessionId: string;
    state: string;
    cart: OrderItem[];
    pendingPayment?: PendingPayment;
}

export interface BotResponse {
    messages: string | string[];
    newState?: string; }



export type TransactionType = "CREDIT" | "DEBIT";

export interface Transaction {
    id: string;
    walletId: string;
    orderId?: string | null;
    amount: number;
    currency: string;
    type: TransactionType;
    status: PaymentStatus;
    provider: string;
    paymentReference: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Wallet {
    id: string;
    sessionId: string;
    balance: number;
    currency: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Order {
    id: string;
    sessionId: string;
    totalAmount: number;
    currency: string;
    status: PaymentStatus;
    provider: PaymentProvider;
    paymentReference: string;
    items?: OrderItem[];
    createdAt: Date;
    updatedAt: Date;
}
