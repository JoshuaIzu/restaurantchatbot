import { CommandStrategy } from "./command.strategy";
import {BotResponse, SessionContext} from "../types";
import { IOrderRepository } from '../repositories/order.repository';

export class HistoryStrategy implements CommandStrategy{
    constructor(private readonly orderRepo: IOrderRepository){

    }
    public async execute(context: SessionContext, _input: string): Promise<BotResponse> {
        try {
            const pastOrders = await this.orderRepo.getOrdersBySessionId(context.sessionId);

            if (!pastOrders || pastOrders.length === 0) {
                return {
                    messages: ["You have no past orders. Reply 0 to return to the main menu"],
                    newState: 'main_menu'
                };
            }
            let historyText: string = "Your Order History:\n";
            pastOrders.forEach((order: any, index: number) => {
                historyText += `${index + 1}. Ref:${order.id} - Total: ${order.totalAmount} ${order.currency} (${order.status})\n`;
            });
            return {
                messages: [historyText],
                newState: 'main_menu'
            };
        } catch (error) {
            const typedError = error as Error;
            return {
                messages: [`Error fetching order history: ${typedError.message}. returning to main menu`],
                newState: 'main_menu'
            }
        }
    }
}