import { chromium } from "playwright";
import { copyFileSync, mkdirSync, readdirSync, statSync } from "fs";
import { join } from "path";

const outDir = "/opt/cursor/artifacts";
const demoWwft = {
  fullName: "Jan de Vries",
  dateOfBirth: "1990-04-12",
  nationality: "NL",
  email: "jan.devries@example.com",
  phone: "+31612345678",
  idDocumentType: "passport",
  idDocumentNumber: "NL12345678",
  addressStreet: "Keizersgracht 123",
  addressCity: "Amsterdam",
  addressPostalCode: "1015 CJ",
  addressCountry: "NL",
  paymentPurpose: "Invoice settlement for design services",
  chainType: 1,
};

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  recordVideo: { dir: outDir, size: { width: 1280, height: 900 } },
});
const page = await context.newPage();

async function fillWwft() {
  await page.locator('input[placeholder="Jan de Vries"]').fill(demoWwft.fullName);
  await page.locator('input[type="date"]').fill(demoWwft.dateOfBirth);
  await page.locator('input[placeholder="jan@example.com"]').fill(demoWwft.email);
  await page.locator('input[placeholder="+31 6 12345678"]').fill(demoWwft.phone);
  await page.locator('input[placeholder="Document number"]').fill(demoWwft.idDocumentNumber);
  await page.locator('input[placeholder="Keizersgracht 123"]').fill(demoWwft.addressStreet);
  await page.locator('input[placeholder="Amsterdam"]').fill(demoWwft.addressCity);
  await page.locator('input[placeholder="1015 CJ"]').fill(demoWwft.addressPostalCode);
  await page.locator('textarea').fill(demoWwft.paymentPurpose);
}

try {
  await page.goto("http://localhost:8085", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  await page.getByRole("link", { name: /ErikBank Pmt/i }).click();
  await page.waitForTimeout(1000);

  await page.getByRole("link", { name: "ErikBank" }).first().click();
  await page.waitForTimeout(1200);

  await fillWwft();
  await page.waitForTimeout(800);

  await page.getByRole("button", { name: /Continue to USDT payment/i }).click();
  await page.waitForTimeout(4000);

  const copyBtn = page.getByRole("button", { name: "Copy" });
  if (await copyBtn.isVisible().catch(() => false)) {
    await copyBtn.click();
    await page.waitForTimeout(1200);
  }

  await page.getByRole("link", { name: "QR code" }).click();
  await page.waitForTimeout(2000);

  await page.getByRole("link", { name: "Disclaimer", exact: true }).click();
  await page.waitForTimeout(1800);

  await page.goto("http://localhost:8085/pay/ideal/ING", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
} finally {
  const video = page.video();
  await page.close();
  await context.close();
  await browser.close();

  if (video) {
    const webmPath = await video.path();
    const target = join(outDir, "erikbank-usdt-demo.webm");
    copyFileSync(webmPath, target);
    console.log("Saved webm:", target);
  }
}

const newestWebm = readdirSync(outDir)
  .filter((f) => f.endsWith(".webm"))
  .map((f) => ({ f, m: statSync(join(outDir, f)).mtimeMs }))
  .sort((a, b) => b.m - a.m)[0]?.f;

if (newestWebm) {
  const input = join(outDir, newestWebm);
  const output = join(outDir, "erikbank-usdt-demo.mp4");
  const { execSync } = await import("child_process");
  execSync(
    `ffmpeg -y -i "${input}" -c:v libx264 -pix_fmt yuv420p -movflags +faststart "${output}"`,
    { stdio: "inherit" },
  );
  console.log("Saved mp4:", output);
}

console.log("Demo video complete");
