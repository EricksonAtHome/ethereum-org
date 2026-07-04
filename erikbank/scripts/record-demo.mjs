import { chromium } from "playwright";
import { mkdirSync } from "fs";

const outDir = "/opt/cursor/artifacts";
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  recordVideo: { dir: outDir, size: { width: 1280, height: 900 } },
});
const page = await context.newPage();

try {
  await page.goto("http://localhost:8085", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  await page.getByRole("button", { name: "Pay now" }).waitFor({ state: "visible" });
  await page.waitForTimeout(1000);

  await page.getByRole("button", { name: "Pay now" }).click();
  await page.waitForTimeout(3500);

  await page.getByRole("button", { name: "QR code" }).click();
  await page.waitForTimeout(2000);

  await page.getByRole("button", { name: "Bank" }).click();
  await page.waitForTimeout(1500);
} finally {
  await context.close();
  await browser.close();
}

console.log("Demo video saved to", outDir);
