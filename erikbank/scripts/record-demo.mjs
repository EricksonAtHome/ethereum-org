import { chromium, devices } from "playwright";
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
  ...devices["iPhone 13"],
  recordVideo: { dir: outDir, size: { width: 390, height: 844 } },
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
  await page.waitForTimeout(1000);

  await page.getByRole("link", { name: /Ayiti Pay/i }).first().click();
  await page.waitForTimeout(800);

  await page.locator('.acceptRow input[type="checkbox"]').check({ force: true });
  await page.getByRole("button", { name: /Start transaction/i }).click({ force: true });
  await page.waitForTimeout(1200);

  await page.getByRole("button", { name: /Continue to pay/i }).click({ force: true });
  await page.waitForTimeout(1200);

  await fillWwft();
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: /Confirm USDT payment/i }).click({ force: true });
  await page.waitForTimeout(2500);

  const copyBtn = page.getByRole("button", { name: "Copy" });
  if (await copyBtn.isVisible().catch(() => false)) {
    await copyBtn.click();
    await page.waitForTimeout(800);
  }

  // Mock UPay marks order paid after ~12s — wait for receipt step
  await page.getByText(/Payment received/i).waitFor({ timeout: 20000 });
  await page.waitForTimeout(2500);
} finally {
  const video = page.video();
  await page.close();
  await context.close();
  await browser.close();

  if (video) {
    const webmPath = await video.path();
    copyFileSync(webmPath, join(outDir, "erikbank-mobile-flow.webm"));
    console.log("Saved webm:", join(outDir, "erikbank-mobile-flow.webm"));
  }
}

const newestWebm = readdirSync(outDir)
  .filter((f) => f.endsWith(".webm"))
  .map((f) => ({ f, m: statSync(join(outDir, f)).mtimeMs }))
  .sort((a, b) => b.m - a.m)[0]?.f;

if (newestWebm) {
  const input = join(outDir, newestWebm);
  const output = join(outDir, "erikbank-mobile-flow.mp4");
  const { execSync } = await import("child_process");
  execSync(
    `ffmpeg -y -i "${input}" -c:v libx264 -pix_fmt yuv420p -movflags +faststart "${output}"`,
    { stdio: "inherit" },
  );
  console.log("Saved mp4:", output);
}

console.log("Mobile demo video complete");
