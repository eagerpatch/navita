import { assignVars } from "../../src";

describe("assignVars", () => {
  it("flattens a contract + tokens into css custom-property setters", () => {
    const vars = assignVars(
      { color: { primary: "", secondary: "" } },
      { color: { primary: "red", secondary: "blue" } },
    );

    expect(vars).toEqual({
      "--color-primary": "red",
      "--color-secondary": "blue",
    });
  });

  it("lowercases and dash-joins the token path into the variable name", () => {
    const vars = assignVars(
      { fontSize: { Large: "" } },
      { fontSize: { Large: "20px" } },
    );

    expect(vars).toEqual({ "--fontsize-large": "20px" });
  });

  it("stringifies numeric token values", () => {
    const vars = assignVars(
      { space: { 1: "" } },
      // numbers are coerced via String()
      { space: { 1: 4 } } as unknown as { space: { 1: string } },
    );

    expect(vars).toEqual({ "--space-1": "4" });
  });

  it("throws when the tokens do not match the contract shape", () => {
    expect(() =>
      assignVars(
        { color: { primary: "" } },
        // @ts-expect-error - intentionally mismatched extra key
        { color: { primary: "red", extra: "oops" } },
      ),
    ).toThrowError(/Tokens don't match contract/);
  });
});
