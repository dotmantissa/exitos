import { defineConfig } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
const browserTemp = resolve(".local/browser-tmp");
mkdirSync(browserTemp, { recursive: true, mode: 0o700 });
export default defineConfig({
  testDir: "tests/browser",
  timeout: 90000,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:5175",
    headless: true,
    launchOptions: { env: { ...process.env, TMPDIR: browserTemp } },
    trace: "retain-on-failure",
  },
  reporter: "list",
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:5175",
    reuseExistingServer: true,
    timeout: 30000,
  },
});
