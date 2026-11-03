import { describe, expect, it } from "vitest";
import { toHolidayDateKey } from "./holidayDate";

describe("toHolidayDateKey", () => {
  it("uses the Philippine calendar date for UTC timestamps", () => {
    expect(toHolidayDateKey("2026-11-01T16:00:00.000000Z")).toBe("2026-11-02");
  });

  it("preserves date-only values", () => {
    expect(toHolidayDateKey("2026-11-02")).toBe("2026-11-02");
  });

  it("returns an empty key for invalid values", () => {
    expect(toHolidayDateKey("not-a-date")).toBe("");
  });
});
