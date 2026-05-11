import api from './api';
import { CreatePaymentResult, Payment, PaymentMethod } from '../types';

export const paymentService = {
  createPayment: (bookingId: string, paymentMethod: Extract<PaymentMethod, 'Cash' | 'PayPal'>) =>
    api
      .post<CreatePaymentResult>('/payments/create', { bookingId, paymentMethod })
      .then((response) => response.data),

  capturePayPalPayment: (payPalOrderId: string) =>
    api
      .post<Payment>('/payments/paypal/capture', { payPalOrderId })
      .then((response) => response.data),
};
