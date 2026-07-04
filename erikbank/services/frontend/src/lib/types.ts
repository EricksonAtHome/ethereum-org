export type PaymentMethod = "erikbank" | "ideal" | "wero";

export interface BankOption {
  code: string;
  name: string;
}

export interface PaymentRequest {
  payeeName: string;
  amountCents: number;
  currency: string;
  method: PaymentMethod;
  bankCode: string;
}

export interface PaymentResponse {
  paymentRef: string;
  status: string;
  payeeName: string;
  amountCents: number;
  currency: string;
  method: string;
  bankCode: string;
  bankName: string;
  fraudScore: number;
  complianceStatus: string;
  routingChannel: string;
  qrPayload: string;
  message: string;
  error?: string;
}

export interface AnalyticsSummary {
  totalTransactions: number;
  volumeCents: number;
  averageFraudScore: number;
}
