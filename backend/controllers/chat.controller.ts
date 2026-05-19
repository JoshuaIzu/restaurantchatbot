import { Request, Response } from 'express';
import { BotEngine } from '../services/bot.engine';
import {SessionContext, OrderItem } from "../types";

declare module 'express-session' {
    interface SessionData {
        state: string;
        cart: OrderItem[];
    }
}

export class ChatController {
    constructor(private readonly botEngine: BotEngine) {}

    public async handleMessage(req: Request, res: Response): Promise<void> {
        try {
            const { message } = req.body;

            if(!message || typeof message !== 'string') {
                res.status(400).json({ error: 'Invalid message format' });
                return;
            }
            //express-session uses the device cookie to automatically map this to the correct Redis record
            const context: SessionContext = {
                sessionId: req.sessionID,
                state: req.session.state || 'main_menu',
                cart: req.session.cart || []
            }

            //delegate to the bot engine
            const messages:string [] = await this.botEngine.handleInput(context, message);

            req.session.state = context.state;
            req.session.cart = context.cart;

            req.session.save((err: Error | null): void => {
                if (err) {
                    console.error( 'Error saving session:', err);
                }
                res.status(200).json({ messages, state: context.state });
            });
        } catch (error) {
            const typedError = error as Error;
            console.error(`Chatbot Controller Error: ${typedError.message}`);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}