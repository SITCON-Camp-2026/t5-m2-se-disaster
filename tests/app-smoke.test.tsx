import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../src/app/App";

describe("App", () => {
  it("renders starter title", () => {
    render(<App />);
    expect(screen.getByText("災害資訊整理工作台")).toBeInTheDocument();
  });

  it("keeps the home page focused on phase 0 tabs", () => {
    render(<App />);

    expect(
      screen.getByRole("button", { name: "原始資訊" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "整理工作台" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "通報" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "地點" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "志工任務" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "人員指派" }),
    ).not.toBeInTheDocument();
  });

  it("shows review states in the phase 0 workbench", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));

    expect(
      screen.getByText(
        "第一階段的成功不是分類正確，而是把為什麼現在還不能判斷說清楚。",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText("待人工確認").length).toBeGreaterThan(0);
    expect(screen.getAllByText("未查核").length).toBeGreaterThan(0);
  });

  it("shows phase 0 workbench with concrete judgements and review notes", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));

    // Should have at least one record without concrete judgement
    expect(screen.getByText("尚未建立整理草稿")).toBeInTheDocument();

    // Should have complete checklist
    expect(screen.getByText(/✓ Starter 已載入/)).toBeInTheDocument();
    expect(
      screen.getByText(/✓ 可編輯、刪除或重設整理草稿/),
    ).toBeInTheDocument();

    // Should show human review notes section
    expect(screen.getByText(/人類審查備註/)).toBeInTheDocument();
  });

  it("opens an inline report draft without leaving the workbench", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));
    fireEvent.click(screen.getByRole("button", { name: "新增報案草稿" }));

    expect(
      screen.getByRole("button", { name: "收合報案草稿" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "報案草稿" }),
    ).toBeInTheDocument();
    expect(screen.getByText("參考原始資訊")).toBeInTheDocument();
    expect(screen.getByText(/第一階段完成檢查/)).toBeInTheDocument();
  });

  it("shows a mock satellite image panel without using a real map", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));

    expect(screen.getByText("非真實影像")).toBeInTheDocument();
    expect(screen.getByText("衛星影像示意")).toBeInTheDocument();
    expect(screen.getByText(/它不是地圖、不是真實衛星圖/)).toBeInTheDocument();
  });
});
