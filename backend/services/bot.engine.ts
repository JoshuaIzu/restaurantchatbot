import { SessionContext, AppEvent, BotResponse } from '../types';
import { Observer } from '../observers/event.observer';
import { CommandStrategy } from "../strategies/command.strategy";
import { MainMenuStrategy } from "../strategies/main-menu.strategy";
import { OrderPlacementStrategy } from "../strategies/place-order.strategy";
import { HistoryStrategy } from "../strategies/history.strategy";
import { IMenuRepository } from "../repositories/menu.repository";
import { IOrderRepository } from "../repositories/order.repository";
import {LogObserver} from "../observers/log-observer";
import { CancelOrderStrategy } from "../strategies/cancel-order.strategy";
import { PaymentStatusStrategy } from "../strategies/payment-status.strategy";

export class BotEngine {
    private observer: Observer[] = [];
    private strategies = new Map<string, CommandStrategy>();

    constructor(
        private readonly menuRepo: IMenuRepository,
        private readonly orderRepo: IOrderRepository,
    ) {
    this.registerStrategies();
    this.attach(new LogObserver());
    }
    private registerStrategies(): void {
        this.strategies.set('main_menu', new MainMenuStrategy());
        this.strategies.set('browsing_menu', new OrderPlacementStrategy(this.menuRepo));
        this.strategies.set('order_history', new HistoryStrategy(this.orderRepo));
        this.strategies.set('cancel_order', new CancelOrderStrategy());
        this.strategies.set('payment_status', new PaymentStatusStrategy(this.orderRepo));
    }

    public registerStrategy(key: string, strategy: CommandStrategy): void {
        this.strategies.set(key, strategy);
    }

    public async handleInput(context:SessionContext, input: string): Promise<string[]> {
        const cleanInput: string = input.trim();
        const strategyKey = this.resolveStrategy(context, cleanInput);
        const strategy :CommandStrategy | undefined = this.strategies.get(strategyKey);

        if (!strategy) {
            return ["I'm sorry, I didn't understand that."];
        }
        const response: BotResponse = await strategy.execute(context, cleanInput);

        if(response.newState) {
            context.state = response.newState;
        }
        return Array.isArray(response.messages) ? response.messages : [response.messages];
    }

    private resolveStrategy(context: SessionContext, input: string): string {
        if (context.state === 'main_menu') {
            const routeMap: Record<string, string> = {
                '1': 'browsing_menu',
                '99': 'checkout',
                '98': 'order_history',
                '97': 'payment_status',
                '0': 'cancel_order',
            };
            return routeMap[input] || 'main_menu';
        }
        return context.state;
    }
    public attach(observer: Observer): void {
        this.observer.push(observer);
    }

    public async notify(event: AppEvent, data: any): Promise<void> {
        await Promise.all(this.observer.map(obs => obs.update(event, data)));
    }




}