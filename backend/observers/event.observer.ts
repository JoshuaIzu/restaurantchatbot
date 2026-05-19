import { AppEvent } from '../types';

export interface Observer {
    update(event: AppEvent, payload: unknown): Promise<void>;
}