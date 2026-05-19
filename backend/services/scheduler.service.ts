import { getOrderQueue, disposeQueue } from '../queue/order.queue';
import { startOrderWorker, disposeWorker } from '../queue/order.worker';
import { IOrderRepository } from '../repositories/order.repository';

export class SchedulerService {
    constructor(
        private readonly orderRepo: IOrderRepository,
        redisUrl: string,
    ) {
        startOrderWorker(redisUrl, orderRepo);
    }

    public async scheduleOrder(orderId: string, scheduledAt: Date): Promise<void> {
        const queue = getOrderQueue(process.env.REDIS_URL || 'redis://localhost:6379');
        const delay = scheduledAt.getTime() - Date.now();
        if (delay <= 0) {
            await queue.add('process-order', { orderId }, { delay: 0 });
            return;
        }
        await queue.add('process-order', { orderId }, { delay });
    }

    public async dispose(): Promise<void> {
        await disposeQueue();
        await disposeWorker();
    }
}
