import { isNestedSelector } from "../../../src/helpers/isNestedSelector";

describe("isNestedSelector", () => {
  it("should return true if the property starts with :", () => {
    expect(isNestedSelector(":hover")).toBe(true);
  });

  it("should return true if the property starts with [", () => {
    expect(isNestedSelector("[disabled]")).toBe(true);
  });

  it("should return true if the property starts with >", () => {
    expect(isNestedSelector("> div")).toBe(true);
  });

  it("should return true if the property starts with &", () => {
    expect(isNestedSelector("&:hover")).toBe(true);
  });

  it("should return true for the adjacent sibling combinator (+)", () => {
    expect(isNestedSelector("+ .sibling")).toBe(true);
  });

  it("should return true for the general sibling combinator (~)", () => {
    expect(isNestedSelector("~ .sibling")).toBe(true);
  });

  it("should return true for descendant nesting via leading whitespace", () => {
    expect(isNestedSelector(" .child")).toBe(true);
  });

  it("should return true for prefixed-context nesting (& not at the start)", () => {
    expect(isNestedSelector(".parent &")).toBe(true);
    expect(isNestedSelector(".dark-mode &")).toBe(true);
  });

  it("should return false for bare type/class/id selectors", () => {
    expect(isNestedSelector("div")).toBe(false);
    expect(isNestedSelector(".child")).toBe(false);
    expect(isNestedSelector("#id")).toBe(false);
  });

  it("should return false for garbage that is not a nesting form", () => {
    expect(isNestedSelector("#####")).toBe(false);
  });
});
