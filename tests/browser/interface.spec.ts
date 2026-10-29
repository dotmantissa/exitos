import { test, expect } from "@playwright/test";
for (const width of [360, 768, 1440])
  for (const colorScheme of ["light", "dark"] as const) {
    test(`Actual disconnected interface at ${width}px in ${colorScheme}`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
      await page.goto("/#Overview");
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "Prepare your backup withdrawal.",
      );
      await expect(page.locator("html")).toHaveAttribute(
        "data-theme",
        colorScheme,
      );
      await expect(
        page.getByRole("button", { name: "Withdraw to wallet", exact: true }),
      ).toBeDisabled();
      if (width === 360)
        await page.getByRole("button", { name: "Toggle navigation" }).click();
      await page
        .getByRole("button", { name: "Recovery code", exact: true })
        .click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "Check the recovery code.",
      );
      if (width === 360)
        await page.getByRole("button", { name: "Toggle navigation" }).click();
      await page
        .getByRole("button", { name: "Transactions", exact: true })
        .click();
      await expect(
        page.getByRole("heading", {
          name: "Connect to see your transactions.",
        }),
      ).toBeVisible();
      if (width === 360)
        await page.getByRole("button", { name: "Toggle navigation" }).click();
      await page
        .getByRole("button", { name: "Test vault", exact: true })
        .click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
      await page.screenshot({
        path: `qa-artifacts/overview-${width}-${colorScheme}.png`,
        fullPage: true,
      });
      expect(errors).toEqual([]);
    });
  }
test("Theme persists and wallet absence has an actionable message", async ({
  page,
}) => {
  await page.goto("/#Overview");
  const initial = await page.locator("html").getAttribute("data-theme");
  await page
    .getByRole("button", {
      name:
        initial === "light" ? "Switch to dark mode" : "Switch to light mode",
    })
    .click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute(
    "data-theme",
    initial === "light" ? "dark" : "light",
  );
  await page
    .getByRole("button", { name: "Connect wallet", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "Open ExitOS in your wallet browser",
  );
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(() => document.activeElement !== document.body),
  ).toBeTruthy();
});
test("Saved route verifies the live release before offering a wallet connection", async ({
  page,
}) => {
  test.setTimeout(180000);
  await page.goto("/recovery-kit.html");
  await expect(page.getByRole("region")).toContainText("Withdraw without", {
    timeout: 120000,
  });
  await expect(
    page.getByRole("button", { name: "Connect wallet", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});

test("Development server cannot serve local wallet files", async ({
  request,
}) => {
  const response = await request.get("/.local/testnet-wallets.json");
  expect(response.status()).toBe(403);
});
