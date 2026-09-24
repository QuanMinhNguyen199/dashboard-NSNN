import puppeteer from "puppeteer-core";

const url = process.argv[2];
if (!url) throw new Error("Capture URL is required");

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: true,
  args: ["--no-sandbox", "--disable-gpu"],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1100, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((resolve) => setTimeout(resolve, 12000));
} finally {
  await browser.close();
}
