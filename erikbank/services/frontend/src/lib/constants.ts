import type { PaymentMethod } from "./types";

export const CRYPTO_CURRENCY = "USDT";
export const DEFAULT_CRYPTO_AMOUNT = "49.99";
export const DEFAULT_AMOUNT_UNITS = 4999;

export const BANK_COLORS: Record<string, string> = {
  ERIKBANK: "#2563eb",
  DANSKE: "#14140f",
  NORDEA: "#4a90d9",
  SEB: "#7a8f4a",
  ING: "#2563eb",
  RABO: "#14140f",
  ABN: "#4a90d9",
  BUNQ: "#7a8f4a",
  BNP: "#2563eb",
  DEUTSCHE: "#14140f",
  SOCIETE: "#4a90d9",
  BBVA: "#7a8f4a",
};

export const BANK_CATALOG: Record<
  PaymentMethod,
  { code: string; name: string }[]
> = {
  erikbank: [
    { code: "ERIKBANK", name: "ErikBank" },
    { code: "DANSKE", name: "Danske Bank" },
    { code: "NORDEA", name: "Nordea" },
    { code: "SEB", name: "SEB" },
  ],
  ideal: [
    { code: "ING", name: "ING" },
    { code: "RABO", name: "Rabobank" },
    { code: "ABN", name: "ABN AMRO" },
    { code: "BUNQ", name: "bunq" },
  ],
  wero: [
    { code: "BNP", name: "BNP Paribas" },
    { code: "DEUTSCHE", name: "Deutsche Bank" },
    { code: "SOCIETE", name: "Société Générale" },
    { code: "BBVA", name: "BBVA" },
  ],
};

export const METHOD_LABELS: Record<
  PaymentMethod,
  { bankTab: string; qrApp: string; title: string; description: string }
> = {
  erikbank: {
    bankTab: "Bank",
    qrApp: "ErikBank",
    title: "ErikBank Pmt",
    description: "Pay with ErikBank crypto routing",
  },
  ideal: {
    bankTab: "iDEAL",
    qrApp: "banking",
    title: "iDEAL Pay",
    description: "Pay via iDEAL crypto bridge",
  },
  wero: {
    bankTab: "Wero",
    qrApp: "Wero",
    title: "Wero Pay",
    description: "Pay via Wero crypto bridge",
  },
};

export const DISCLAIMER = {
  title: "Cryptocurrency disclaimer",
  summary:
    "ErikBank Pmt settles in USDT cryptocurrency only. Amounts shown are not euro (EUR) fiat payments.",
  points: [
    "This platform processes USDT cryptocurrency transactions on TRC20/ERC20 blockchain rails, not SEPA or card euro payments.",
    "Any euro-style formatting in the UI is illustrative only and does not represent fiat currency settlement.",
    "Digital asset values are volatile. You may receive a different fiat equivalent at settlement time.",
    "Only send USDT through the displayed wallet address or QR code on the selected chain.",
    "WWFT (Dutch AML) payer data is collected and stored in PostgreSQL for every payment.",
    "ErikBank Pmt integrates the UPay USDT Payment Gateway with ErikBank design — not a licensed bank.",
  ],
};

export function isPaymentMethod(value: string): value is PaymentMethod {
  return value === "erikbank" || value === "ideal" || value === "wero";
}

export function bankInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function formatCryptoAmount(units: number = DEFAULT_AMOUNT_UNITS): string {
  const value = (units / 100).toFixed(2);
  return `${value} ${CRYPTO_CURRENCY}`;
}

export function formatCryptoParts(units: number = DEFAULT_AMOUNT_UNITS): {
  whole: string;
  fraction: string;
  symbol: string;
} {
  const value = (units / 100).toFixed(2);
  const [whole, fraction = "00"] = value.split(".");
  return { whole, fraction, symbol: CRYPTO_CURRENCY };
}

export function payBankPath(method: PaymentMethod, bankCode: string): string {
  return `/pay/${method}/${bankCode.toLowerCase()}`;
}

export function payQrPath(method: PaymentMethod): string {
  return `/pay/${method}/qr`;
}

export function methodHubPath(method: PaymentMethod): string {
  return `/pay/${method}`;
}
