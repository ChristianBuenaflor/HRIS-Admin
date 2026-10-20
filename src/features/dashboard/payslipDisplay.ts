import type { PayslipPeriod, PayslipSummary } from "./dashboardData";

export interface PayslipChartRow {
  id: string;
  label: string;
  netPay: number;
}

export interface PayslipAnnouncement {
  period: PayslipPeriod;
  released: boolean;
}

export const formatPayslipCurrency = (value: number): string =>
  `₱${Math.round(value).toLocaleString("en-PH")}`;

export const formatPayslipCompactCurrency = (value: number): string => {
  const absolute = Math.abs(value);

  if (absolute >= 1_000_000) {
    const millions = value / 1_000_000;
    const digits = Math.abs(millions) >= 10 ? 0 : 1;
    return `₱${millions.toFixed(digits)}M`;
  }

  if (absolute >= 1_000) return `₱${Math.round(value / 1_000)}k`;
  return `₱${Math.round(value)}`;
};

export const formatPayslipDate = (value: string): string => {
  const dateKey = value.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) return "";

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const getPayslipAnnouncement = (
  summary: PayslipSummary,
): PayslipAnnouncement | null => {
  if (summary.latestProcessed) {
    return { period: summary.latestProcessed, released: true };
  }

  if (summary.latestDraft) {
    return { period: summary.latestDraft, released: false };
  }

  return null;
};

export const buildPayslipChartData = (history: PayslipPeriod[]): PayslipChartRow[] =>
  history.map((period) => ({
    id: period.id,
    label: period.rangeLabel || period.name,
    netPay: period.netPay,
  }));
