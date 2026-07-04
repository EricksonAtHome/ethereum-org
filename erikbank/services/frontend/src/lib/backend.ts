const routerUrl =
  process.env.PAYMENT_ROUTER_URL || "http://localhost:8082";
const fraudUrl =
  process.env.FRAUD_ANALYTICS_URL || "http://localhost:8084";

export function getRouterUrl(): string {
  return routerUrl;
}

export function getFraudUrl(): string {
  return fraudUrl;
}
