export type PaymentMethod = "erikbank" | "ideal" | "wero";

export type ChainType = 1 | 2;

export interface BankOption {
  code: string;
  name: string;
}

export interface WwftPayerData {
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  email: string;
  phone: string;
  idDocumentType: string;
  idDocumentNumber: string;
  addressStreet: string;
  addressCity: string;
  addressPostalCode: string;
  addressCountry: string;
  paymentPurpose: string;
  chainType: ChainType;
}

export interface PaymentRequest {
  payeeName: string;
  amountCents: number;
  currency: string;
  method: PaymentMethod;
  bankCode: string;
  wwft: WwftPayerData;
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
  merchantOrderSn?: string;
  payUsdt?: number;
  usdtAddress?: string;
  qrImageUrl?: string;
  chainType?: ChainType;
  chainLabel?: string;
  exchangeRate?: number;
  expiresAt?: number;
  usdtOrderStatus?: number;
  error?: string;
}

export interface UsdtStatusResponse {
  paymentRef: string;
  merchantOrderSn: string;
  usdtOrderStatus: number;
  payUsdt: number;
  usdtAddress: string;
  status: string;
  successTime?: number;
  message?: string;
}

export interface AnalyticsSummary {
  totalTransactions: number;
  volumeCents: number;
  averageFraudScore: number;
}

export const EMPTY_WWFT: WwftPayerData = {
  fullName: "",
  dateOfBirth: "",
  nationality: "NL",
  email: "",
  phone: "",
  idDocumentType: "passport",
  idDocumentNumber: "",
  addressStreet: "",
  addressCity: "",
  addressPostalCode: "",
  addressCountry: "NL",
  paymentPurpose: "",
  chainType: 1,
};
