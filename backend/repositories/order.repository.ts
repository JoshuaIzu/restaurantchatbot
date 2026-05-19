import { OrderItem, PaymentProvider, PaymentStatus } from "../types";

export interface CreateOrderInput {
    sessionId: string;
    items: OrderItem[];
    totalAmount: number;
    currency: string;
    provider: PaymentProvider;
    paymentReference: string;
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

export interface IOrderRepository {
    createOrder(input: CreateOrderInput): Promise<Order>;
    getOrdersBySessionId(sessionId: string): Promise<Order[]>;
    getByReference(reference: string): Promise<Order | undefined>;
    updateOrderStatus(reference: string, status: PaymentStatus): Promise<Order | undefined>;
}
