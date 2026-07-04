import type { PaymentMethod } from "./types";

export const CRYPTO_CURRENCY = "ETH";
export const DEFAULT_CRYPTO_AMOUNT = "0.0499";
export const DEFAULT_AMOUNT_UNITS = 4999;

export const BANK_COLORS: Record<string, string> = {
  ERIKBANK: "#e8672c",
  DANSKE: "#14140f",
  NORDEA: "#4a90d9",
  SEB: "#7a8f4a",
  ING: "#e8672c",
  RABO: "#14140f",
  ABN: "#4a90d9",
  BUNQ: "#7a8f4a",
  BNP: "#e8672c",
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
    "ErikBank Pmt settles in cryptocurrency only. Amounts shown in ETH are not euro (EUR) fiat payments.",
  points: [
    "This platform processes cryptocurrency transactions on blockchain rails, not SEPA or card euro payments.",
    "Any euro-style formatting in the UI is illustrative only and does not represent fiat currency settlement.",
    "Digital asset values are volatile. You may receive a different fiat equivalent at settlement time.",
    "Only send supported crypto assets through the displayed wallet address or QR payload.",
    "ErikBank Pmt is a technical demo stack (Next.js, Go, Java, C#, Python, PostgreSQL) and not a licensed bank.",
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
  const eth = (units / 100000).toFixed(4).replace(/0+$/, "").replace(/\.$/, ".0");
  return `${eth} ${CRYPTO_CURRENCY}`;
}

export function formatCryptoParts(units: number = DEFAULT_AMOUNT_UNITS): {
  whole: string;
  fraction: string;
  symbol: string;
} {
  const [whole, fraction = "0"] = (units / 100000).toFixed(4).split(".");
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
