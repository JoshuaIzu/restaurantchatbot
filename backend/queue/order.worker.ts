import { Worker, Job } from 'bullmq';
import { IOrderRepository } from '../repositories/order.repository';

let workerInstance: Worker | null = null;

export function startOrderWorker(redisUrl: string, orderRepo: IOrderRepository): Worker {
    if (!workerInstance) {
        workerInstance = new Worker(
            'order-scheduler',
            async (job: Job) => {
                const { orderId } = job.data;
                const order = await orderRepo.getByReference(orderId);
                if (order && order.status === 'COMPLETED') {
                    console.log(`[Scheduler] Processing scheduled order ${orderId}`);
                }
            },
            { connection: { url: redisUrl } },
        );
    }
    return workerInstance;
}

export async function disposeWorker(): Promise<void> {
    if (workerInstance) {
        await workerInstance.close();
        workerInstance = null;
    }
}
