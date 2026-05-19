import { CommandStrategy } from './command.strategy';
import {SessionContext, BotResponse, OrderItem, MenuItem } from '../types';
import { IMenuRepository } from '../repositories/menu.repository';

export class OrderPlacementStrategy implements CommandStrategy {
    constructor(private readonly menuRepo: IMenuRepository ) { }

    public async execute(context: SessionContext, input: string): Promise<BotResponse> {
        const cleanInput: string = input.trim();

        if (context.state === "main_menu") {
            const items = await this.menuRepo.getAvailableItems();

            let messageText = "Here is our Menu:\n";
            items.forEach((item: MenuItem, index: number): void => {
                messageText += `${index+1}. ${item.name} - ${item.price} \n`;
            });
            messageText += "\nReply with the item number to add to your cart, or 99 to checkout.";
            return {
                messages: [messageText],
                newState: 'browsing_menu' //Bot Engine handles the actual state transition
            };

        }

        if (context.state === "browsing_menu") {
            if (cleanInput === "99") {
                return {
                    messages: ["Moving to checkout. Please review your order."],
                    newState: 'checkout'
                };
            }
            //Mapping user numeric input to Menu arrays
            const itemIndex  = parseInt(cleanInput) -1;
            const items = await this.menuRepo.getAvailableItems();
            const selectedItem = items[itemIndex];

            if(!selectedItem) {
                return {
                    messages: ["Invalid item. Please select a valid number from menu"],
                    newState: 'browsing_menu'
                };
            }
            const orderItem: OrderItem = {
                menuItemId: selectedItem.id,
                name: selectedItem.name,
                price: selectedItem.price,
                quantity: 1
            };
            context.cart.push(orderItem);
            return {
                messages: [`${selectedItem.name} added to cart! Reply with another number to add more, or 99 to checkout.`],
                newState: 'browsing_menu'
            };
        }
        return {
            messages: ["Unexpected state. Reply 0 to cancel and return to the main menu."],
            newState: 'main_menu'
        };
    }

}