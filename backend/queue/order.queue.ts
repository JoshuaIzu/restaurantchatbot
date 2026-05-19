import { Queue } from 'bullmq';

let orderQueue: Queue | null = null;

export function getOrderQueue(redisUrl: string): Queue {
    if (!orderQueue) {
        orderQueue = new Queue('order-scheduler', { connection: { url: redisUrl } });
    }
    return orderQueue;
}

export async function disposeQueue(): Promise<void> {
    if (orderQueue) {
        await orderQueue.close();
        orderQueue = null;
    }
}
