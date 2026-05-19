import { AppEvent } from '../types';
import { Observer } from "./event.observer";
import pino from 'pino';

const logger = pino({ level: 'info' });

export class LogObserver implements Observer {
    async update(event: AppEvent, payload: unknown): Promise<void> {
        logger.info({ event, payload}, `AppEvent: ${event}`);
    }
}