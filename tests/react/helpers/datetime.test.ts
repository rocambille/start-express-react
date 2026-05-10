import { describe, expect, it } from "vitest";
import {
  fromInputParts,
  getDisplayOptions,
  setDisplayOptions,
  toDisplayString,
  toInputDate,
  toInputTime,
} from "../../../src/react/helpers/datetime";

describe("DateTime Helpers", () => {
  describe("fromInputParts", () => {
    it("should parse standard date and time (Europe/Paris)", () => {
      // 10:00 AM in Paris on May 5th (CEST, UTC+2) -> 08:00 UTC
      const date = fromInputParts("2026-05-05", "10:00", "Europe/Paris");
      expect(date.toISOString()).toBe("2026-05-05T08:00:00.000Z");
    });

    it("should parse standard date and time (America/New_York)", () => {
      // 10:00 AM in New York on May 5th (EDT, UTC-4) -> 14:00 UTC
      const date = fromInputParts("2026-05-05", "10:00", "America/New_York");
      expect(date.toISOString()).toBe("2026-05-05T14:00:00.000Z");
    });

    it("should handle DST transition boundaries (Europe/Paris)", () => {
      // In CEST (UTC+2) - before transition
      const beforeDST = fromInputParts("2026-10-24", "12:00", "Europe/Paris");
      // In CET (UTC+1) - after transition
      const afterDST = fromInputParts("2026-10-26", "12:00", "Europe/Paris");

      // Verify UTC strings reflect the shift in offset
      // Oct 24, 12:00 CEST -> 10:00 UTC
      // Oct 26, 12:00 CET -> 11:00 UTC
      expect(beforeDST.toISOString()).toBe("2026-10-24T10:00:00.000Z");
      expect(afterDST.toISOString()).toBe("2026-10-26T11:00:00.000Z");
    });
  });

  describe("toInputDate", () => {
    it("should format date as YYYY-MM-DD (Europe/Paris)", () => {
      expect(toInputDate("2026-05-05T00:00:00.000Z", "Europe/Paris")).toBe(
        "2026-05-05",
      );
    });

    it("should format date as YYYY-MM-DD (America/New_York)", () => {
      expect(toInputDate("2026-05-05T00:00:00.000Z", "America/New_York")).toBe(
        "2026-05-04",
      );
    });

    it("should return correct date when time is around midnight (Europe/Paris)", () => {
      // At 23:00 UTC on the 4th -> 01:00 on the 5th in Paris
      expect(toInputDate("2026-05-04T23:00:00.000Z", "Europe/Paris")).toBe(
        "2026-05-05",
      );
    });
  });

  describe("toInputTime", () => {
    it("should format time as HH:mm (Europe/Paris)", () => {
      // 09:05 UTC -> 11:05 Paris (UTC+2)
      expect(toInputTime("2026-05-05T09:05:00.000Z", "Europe/Paris")).toBe(
        "11:05",
      );
    });

    it("should format time as HH:mm (America/New_York)", () => {
      // 09:05 UTC -> 05:05 AM New York (UTC-4)
      expect(toInputTime("2026-05-05T09:05:00.000Z", "America/New_York")).toBe(
        "05:05",
      );
    });

    it("should handle midnight correctly (Europe/Paris)", () => {
      // 22:00 UTC on May 4th is 00:00 (midnight) on May 5th in Paris
      expect(toInputTime("2026-05-04T22:00:00.000Z", "Europe/Paris")).toBe(
        "00:00",
      );
    });
  });

  describe("setDisplayOptions", () => {
    const originalOptions = getDisplayOptions();

    afterAll(() => {
      setDisplayOptions(originalOptions);
    });

    it("should update display options", () => {
      setDisplayOptions({ timeZone: "America/New_York" });
      expect(getDisplayOptions().timeZone).toBe("America/New_York");
    });
  });

  describe("toDisplayString", () => {
    const originalOptions = getDisplayOptions();

    afterAll(() => {
      setDisplayOptions(originalOptions);
    });

    it("should format date and time as localized string (Europe/Paris)", () => {
      const iso = "2026-05-05T09:05:00.000Z";
      // 09:05 UTC -> 11:05 Paris (UTC+2)
      setDisplayOptions({ timeZone: "Europe/Paris" });
      expect(toDisplayString(iso)).toContain("5 mai 2026");
      expect(toDisplayString(iso)).toContain("11:05");
    });

    it("should format date and time as localized string (America/New_York)", () => {
      const iso = "2026-05-05T09:05:00.000Z";
      // 09:05 UTC -> 05:05 AM New York (UTC-4)
      setDisplayOptions({ timeZone: "America/New_York" });
      expect(toDisplayString(iso)).toContain("5 mai 2026");
      expect(toDisplayString(iso)).toContain("05:05");
    });

    it("should handle different locales and styles", () => {
      const iso = "2026-05-05T12:00:00.000Z";
      setDisplayOptions({
        locale: "en-US",
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/New_York",
      });
      expect(toDisplayString(iso)).toContain("5/5/26");
      expect(toDisplayString(iso)).toContain("8:00");
    });
  });
});
