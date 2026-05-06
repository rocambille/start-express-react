import { describe, expect, it } from "vitest";
import {
  fromInputParts,
  toDisplayString,
  toInputDate,
  toInputTime,
} from "../../../src/react/helpers/datetime";

describe("DateTime Helpers", () => {
  describe("fromInputParts", () => {
    it("should correctly parse standard date and time", () => {
      const date = fromInputParts("2026-05-05", "10:00");
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(4); // May
      expect(date.getDate()).toBe(5);
      expect(date.getHours()).toBe(10);
      expect(date.getMinutes()).toBe(0);
    });

    it("should handle DST transition boundaries (Europe/Paris)", () => {
      // In CEST (UTC+2) - before transition
      const beforeDST = fromInputParts("2026-10-24", "12:00");
      // In CET (UTC+1) - after transition
      const afterDST = fromInputParts("2026-10-26", "12:00");

      // Verify UTC strings reflect the shift in offset
      // Oct 24, 12:00 CEST -> 10:00 UTC
      // Oct 26, 12:00 CET -> 11:00 UTC
      expect(beforeDST.toISOString()).toContain("T10:00:00.000Z");
      expect(afterDST.toISOString()).toContain("T11:00:00.000Z");
    });

    it("should parse parts in a specific timezone (e.g. New York)", () => {
      // 10:00 AM in New York on May 5th (EDT, UTC-4) -> 14:00 UTC
      const date = fromInputParts("2026-05-05", "10:00", "America/New_York");
      expect(date.toISOString()).toContain("T14:00:00.000Z");
    });
  });

  describe("toInputDate", () => {
    it("should format date as YYYY-MM-DD", () => {
      const date = new Date(2026, 4, 5, 10, 0); // May 5th
      expect(toInputDate(date)).toBe("2026-05-05");
    });

    it("should accept an ISO string as input", () => {
      const iso = "2026-05-05T00:00:00.000Z";
      // In Paris (UTC+2), this is 2026-05-05
      expect(toInputDate(iso)).toBe("2026-05-05");
      // At 23:00 UTC on the 4th
      expect(toInputDate("2026-05-04T23:00:00.000Z")).toBe("2026-05-05");
    });
  });

  describe("toInputTime", () => {
    it("should format time as HH:mm", () => {
      const date = new Date(2026, 4, 5, 9, 5);
      expect(toInputTime(date)).toBe("09:05");
    });

    it("should accept an ISO string as input", () => {
      // 09:05 UTC is 11:05 in Paris (UTC+2)
      expect(toInputTime("2026-05-05T09:05:00.000Z")).toBe("11:05");
    });

    it("should handle midnight correctly (covering 24/00 branch)", () => {
      // 22:00 UTC on May 4th is 00:00 (midnight) on May 5th in Paris
      expect(toInputTime("2026-05-04T22:00:00.000Z")).toBe("00:00");
    });
  });

  describe("toDisplayString", () => {
    it("should format date and time as localized string", () => {
      const date = new Date(2026, 4, 5, 9, 5);
      // We expect the French format by default
      expect(toDisplayString(date)).toContain("5 mai 2026");
    });

    it("should handle a specific timezone (e.g. New York)", () => {
      const iso = "2026-05-05T12:00:00.000Z";
      // 12:00 UTC is 08:00 in New York (EDT, UTC-4)
      expect(toDisplayString(iso, { timeZone: "America/New_York" })).toContain(
        "08:00",
      );
      // 12:00 UTC is 14:00 in Paris (CEST, UTC+2)
      expect(toDisplayString(iso, { timeZone: "Europe/Paris" })).toContain(
        "14:00",
      );
    });

    it("should handle different locales and styles", () => {
      const iso = "2026-05-05T12:00:00.000Z";
      const result = toDisplayString(iso, {
        locale: "en-US",
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/New_York",
      });
      // 5/5/26, 8:00 AM (or similar)
      expect(result).toContain("5/5/26");
      expect(result).toContain("8:00");
    });
  });
});
