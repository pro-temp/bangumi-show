import { expect, test } from "@playwright/test";

test("shows the current season entry point", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Bangumi Show" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "当前季度番表" })).toBeVisible();
  await expect(page.getByPlaceholder("搜索中文名、日文名、罗马音或别名")).toBeVisible();
});

test("searches, opens details, and stores local collection status", async ({ page }) => {
  await page.goto("/");

  await page.getByPlaceholder("搜索中文名、日文名、罗马音或别名").fill("星港");
  await page.getByRole("button", { name: "搜索" }).click();

  await expect(page.getByRole("heading", { name: "搜索：星港" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "星港观测者" })).toBeVisible();

  await page.getByRole("button", { name: /星港观测者/ }).click();
  await expect(page.getByRole("heading", { name: "详情面板" })).toBeVisible();
  await expect(
    page.getByRole("tabpanel", { name: "概览" }).getByText("近未来港湾都市")
  ).toBeVisible();

  await page
    .locator("article")
    .filter({ hasText: "星港观测者" })
    .getByRole("combobox", { name: "收藏状态" })
    .click();
  await page.getByRole("option", { name: "想看" }).click();
  await page.getByRole("link", { name: "收藏" }).click();

  await expect(page.getByRole("heading", { name: "本地收藏" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "星港观测者" })).toBeVisible();
  await expect(page.getByText("想看")).toBeVisible();
});
