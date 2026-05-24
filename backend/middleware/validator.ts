import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

const chatSchema = z.object({
    message: z.string().min(1, 'Message cannot be empty'),
});

const paymentInitSchema = z.object({
    sessionId: z.string().min(1, 'Session ID is required'),
    items: z.array(z.object({
        menuItemId: z.string(),
        name: z.string(),
        price: z.number(),
        quantity: z.number(),
    })),
    total: z.number().positive('Total must be positive'),
    currency: z.string().min(1, 'Currency is required'),
    email: z.string().email('Valid email is required').optional(),
});

export function validateChat(req: Request, res: Response, next: NextFunction) {
    const result = chatSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: 'Validation failed', details: result.error.issues });
        return;
    }
    next();
}

export function validatePaymentInit(req: Request, res: Response, next: NextFunction) {
    const result = paymentInitSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: 'Validation failed', details: result.error.issues });
        return;
    }
    next();
}
