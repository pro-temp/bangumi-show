import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CopyTitleButton } from "./copy-title-button";
import { TooltipProvider } from "./tooltip";

describe("CopyTitleButton", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("copies the title and exposes a confirmation state", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText }
    });

    render(
      <TooltipProvider>
        <CopyTitleButton title="星港观测者" />
      </TooltipProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "复制番名：星港观测者" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith("星港观测者"));
    expect(screen.getByRole("button", { name: "已复制番名：星港观测者" })).toBeInTheDocument();
  });
});
