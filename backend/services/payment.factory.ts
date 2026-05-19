import { IPaymentProvider } from './payment.provider';
import { PaystackProvider } from './paystack.provider';
import { CircleUsdcProvider } from './circle-usdc.provider';
import { PaymentProvider } from '../types';

export function createPaymentProvider(name: PaymentProvider): IPaymentProvider {
    switch (name) {
        case 'circle_usdc':
            return new CircleUsdcProvider();
        case 'paystack':
        default:
            return new PaystackProvider();
    }
}