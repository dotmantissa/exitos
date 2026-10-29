import { test, expect } from "@playwright/test";

for (const width of [360, 768, 1440])
  for (const colorScheme of ["light", "dark"] as const) {
    test(`First visit explains the actual product at ${width}px in ${colorScheme}`, async ({
      page,
    }) => {
      const chainRequests: string[] = [];
      page.on("request", (request) => {
        if (/testrpc|xlayertestrpc/.test(request.url()))
          chainRequests.push(request.url());
      });
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
      await page.goto("/");
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "A backup withdrawal page for DeFi vaults.",
      );
      await expect(
        page.getByText("One real test vault on X Layer.", { exact: false }),
      ).toBeVisible();
      await expect(
        page.getByText("Your DeFi app’s website can go offline", {
          exact: false,
        }),
      ).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute(
        "data-theme",
        colorScheme,
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
      expect(chainRequests).toEqual([]);
      await page.screenshot({
        path: `qa-artifacts/introduction-${width}-${colorScheme}.png`,
        fullPage: true,
      });
      await page
        .getByRole("button", { name: "Try the test vault", exact: true })
        .first()
        .click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "Prepare your backup withdrawal.",
      );
      await expect(
        page.getByRole("region", { name: "Your next step" }),
      ).toContainText("Start with your wallet");
      await expect(
        page.getByRole("button", { name: "Deposit XUSD", exact: true }),
      ).toBeDisabled();
      await page
        .getByRole("button", { name: "What is ExitOS?", exact: true })
        .click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "A backup withdrawal page for DeFi vaults.",
      );
      await page.goBack();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "Prepare your backup withdrawal.",
      );
    });
  }

test("Explanation links and recovery entry are usable without connecting a wallet", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("link", { name: "See how recovery works", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /Prepare once/ }),
  ).toBeVisible();
  await page.getByText("What can I use today?", { exact: true }).click();
  await expect(
    page.getByText("Test OKB pays the network fee.", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Open recovery", exact: true })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Withdraw your vault tokens.",
  );
  await expect(
    page.getByRole("region", { name: "Your next step" }),
  ).toContainText("Connect a browser wallet");
});
