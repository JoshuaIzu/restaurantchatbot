import { SessionContext, BotResponse } from '../types';

export interface CommandStrategy {
    execute(context: SessionContext, input: string) : Promise<BotResponse>;
}
