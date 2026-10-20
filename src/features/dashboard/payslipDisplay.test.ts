import { describe, expect, it } from "vitest";
import type { PayslipPeriod, PayslipSummary } from "./dashboardData";
import {
  buildPayslipChartData,
  formatPayslipCompactCurrency,
  formatPayslipCurrency,
  formatPayslipDate,
  getPayslipAnnouncement,
} from "./payslipDisplay";

const period = (overrides: Partial<PayslipPeriod> = {}): PayslipPeriod => ({
  id: "196",
  name: "October 1-15, 2026",
  status: "processed",
  payDate: "2026-10-20",
  rangeLabel: "Oct 1–15",
  employeeCount: 14,
  netPay: 127312.5,
  grossPay: 132812.5,
  deductions: 5500,
  ...overrides,
});

describe("payslip display helpers", () => {
  it("formats full and compact peso amounts", () => {
    expect(formatPayslipCurrency(127312.5)).toBe("₱127,313");
    expect(formatPayslipCompactCurrency(127312.5)).toBe("₱127k");
    expect(formatPayslipCompactCurrency(0)).toBe("₱0");
  });

  it("formats a pay date without a timezone shift", () => {
    expect(formatPayslipDate("2026-10-20")).toBe("Oct 20, 2026");
    expect(formatPayslipDate("")).toBe("");
  });

  it("prefers the latest processed payslip over a draft", () => {
    const summary: PayslipSummary = {
      latestProcessed: period(),
      latestDraft: period({ id: "194", status: "draft", netPay: 133132.5 }),
      history: [period()],
    };

    expect(getPayslipAnnouncement(summary)).toMatchObject({
      released: true,
      period: { id: "196" },
    });
    expect(
      getPayslipAnnouncement({
        latestProcessed: null,
        latestDraft: period({ id: "194", status: "draft" }),
        history: [],
      }),
    ).toMatchObject({ released: false, period: { id: "194" } });
    expect(
      getPayslipAnnouncement({ latestProcessed: null, latestDraft: null, history: [] }),
    ).toBeNull();
  });

  it("maps payslip history to chart rows", () => {
    const rows = buildPayslipChartData([
      period({ id: "188", rangeLabel: "Sep 16–30", netPay: 900 }),
      period(),
    ]);

    expect(rows).toEqual([
      { id: "188", label: "Sep 16–30", netPay: 900 },
      { id: "196", label: "Oct 1–15", netPay: 127312.5 },
    ]);
  });
});
