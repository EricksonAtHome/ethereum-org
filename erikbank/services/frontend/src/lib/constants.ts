import type { PaymentMethod } from "./types";

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

export const METHOD_LABELS: Record<
  PaymentMethod,
  { bankTab: string; qrApp: string; title: string }
> = {
  erikbank: {
    bankTab: "Bank",
    qrApp: "ErikBank",
    title: "ErikBank Pmt",
  },
  ideal: {
    bankTab: "iDEAL",
    qrApp: "banking",
    title: "iDEAL Pay",
  },
  wero: {
    bankTab: "Wero",
    qrApp: "Wero",
    title: "Wero Pay",
  },
};

export function bankInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function formatAmountParts(cents: number): {
  whole: string;
  fraction: string;
} {
  const euros = (cents / 100).toFixed(2).replace(".", ",");
  const [whole, fraction] = euros.split(",");
  return { whole, fraction };
}
