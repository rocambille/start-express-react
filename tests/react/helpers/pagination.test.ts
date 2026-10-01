import { parseContentRangeTotal } from "../../../src/react/helpers/pagination";

describe("React Helpers: pagination", () => {
  describe("parseContentRangeTotal()", () => {
    it("should extract the total from a valid Content-Range header", () => {
      expect(parseContentRangeTotal("items 0-9/42")).toBe(42);
    });

    it("should handle single-page results", () => {
      expect(parseContentRangeTotal("items 0-1/2")).toBe(2);
    });

    it("should return 0 for a null header", () => {
      expect(parseContentRangeTotal(null)).toBe(0);
    });

    it("should return 0 for a malformed header", () => {
      expect(parseContentRangeTotal("bytes 0-9/42")).toBe(42); // different unit, total still parseable
      expect(parseContentRangeTotal("invalid")).toBe(0);
    });
  });
});
