import { chromium } from "playwright";
import { copyFileSync, mkdirSync } from "fs";
import { join } from "path";

const outDir = "/opt/cursor/artifacts";
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();

const shots = [
  { url: "http://localhost:8085", name: "erikbank-desktop-home.png" },
  { url: "http://localhost:8085/pay/erikbank/ERIKBANK", name: "erikbank-desktop-welcome.png" },
];

for (const shot of shots) {
  await page.goto(shot.url, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(outDir, shot.name), fullPage: false });
  console.log("Saved:", join(outDir, shot.name));
}

// Welcome step with checkbox accepted
await page.goto("http://localhost:8085/pay/erikbank/ERIKBANK", { waitUntil: "networkidle" });
await page.locator('.acceptRow input[type="checkbox"]').check({ force: true });
await page.waitForTimeout(400);
await page.screenshot({ path: join(outDir, "erikbank-desktop-welcome-checked.png"), fullPage: false });
console.log("Saved:", join(outDir, "erikbank-desktop-welcome-checked.png"));

await browser.close();
console.log("Desktop screenshots complete");
