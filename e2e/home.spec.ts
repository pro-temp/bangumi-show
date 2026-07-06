import { expect, test } from "@playwright/test";

test("shows the current season entry point", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Bangumi Show" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "当前季度番表" })).toBeVisible();
  await expect(page.getByPlaceholder("搜索中文名、日文名、罗马音或别名")).toBeVisible();
});
