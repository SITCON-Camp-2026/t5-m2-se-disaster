import { describe, expect, it } from "vitest";
import messyReports from "../src/fixtures/phase-0/messy-reports.json";
import {
  createPhase0Judgement,
  summarizePhase0PreparationChecks,
  summarizePhase0ToolNeedSignals,
} from "../src/features/phase-0/phase0-heuristics";

describe("phase 0 heuristics", () => {
  it("loads the current phase 0 messy data", () => {
    expect(messyReports).toHaveLength(12);
    expect(messyReports.map((record) => record.id)).toEqual(
      Array.from(
        { length: 12 },
        (_, index) => `M-${String(index + 1).padStart(3, "0")}`,
      ),
    );
  });

  it("provides concrete judgements for at least 6 records", () => {
    const judgements = messyReports.map(createPhase0Judgement);

    const concreteJudgements = judgements.filter(
      (judgement) => judgement.possibleKind !== "unknown",
    );
    expect(concreteJudgements.length).toBeGreaterThanOrEqual(6);
  });

  it("maintains conservative safety boundaries for unverified records", () => {
    const unverifiedRecords = messyReports.filter(
      (record) => record.verificationStatus !== "verified",
    );

    const judgements = unverifiedRecords.map(createPhase0Judgement);

    judgements.forEach((judgement) => {
      expect(judgement.unsafeToActDirectly).toBe(true);
    });
  });

  it("marks records as safe to review without confirming facts", () => {
    const judgement = createPhase0Judgement(messyReports[9]); // M-010

    expect(messyReports[9].verificationStatus).toBe("needs_review");
    expect(judgement.unsafeToActDirectly).toBe(true);
  });

  it("provides concrete analysis when sufficient evidence exists", () => {
    // M-003 should have concrete judgement
    const m003 = messyReports.find((r) => r.id === "M-003");
    const judgement = createPhase0Judgement(m003!);

    expect(judgement.possibleKind).not.toBe("unknown");
    expect(judgement.confidence).not.toBe("low");
    expect(judgement.evidence.length).toBeGreaterThan(0);
  });

  it("extracts tool need signals without turning them into a preparation order", () => {
    const toolNeedSignals = summarizePhase0ToolNeedSignals(messyReports);

    expect(toolNeedSignals.map((signal) => signal.label)).toContain("鏟子");
    expect(toolNeedSignals.map((signal) => signal.label)).toContain("雨鞋");
    expect(
      toolNeedSignals.every((signal) => signal.canPrepareDirectly === false),
    ).toBe(true);
  });

  it("shows departure preparation questions without inventing missing info", () => {
    const checks = summarizePhase0PreparationChecks(messyReports);

    expect(checks.find((item) => item.label === "飲用水")?.status).toBe(
      "has_raw_clue",
    );
    expect(checks.find((item) => item.label === "道路與路況")?.status).toBe(
      "has_raw_clue",
    );
    expect(checks.find((item) => item.label === "食物")?.status).toBe(
      "missing_from_raw_info",
    );
    expect(checks.find((item) => item.label === "休息或睡覺地點")?.status).toBe(
      "missing_from_raw_info",
    );
    expect(checks.find((item) => item.label === "車輛大小")?.status).toBe(
      "missing_from_raw_info",
    );
  });
});
