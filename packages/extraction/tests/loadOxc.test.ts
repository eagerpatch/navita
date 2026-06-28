import { getParser, getTransform } from "../src/loadOxc";

describe("loadOxc — getParser", () => {
  it("loads a working oxc-parser through the native-require workaround", () => {
    const parser = getParser();
    expect(typeof parser.parseSync).toBe("function");

    const { program } = parser.parseSync("t.ts", `const a = 1;`, {
      lang: "ts",
      sourceType: "module",
    });
    expect(program.body[0].type).toBe("VariableDeclaration");
  });

  it("memoizes the parser instance", () => {
    expect(getParser()).toBe(getParser());
  });
});

describe("loadOxc — getTransform", () => {
  it("loads a working oxc-transform through the native-require workaround", () => {
    const transform = getTransform();
    expect(typeof transform.transformSync).toBe("function");

    const result = transform.transformSync("t.ts", `const a: number = 1;`, {});
    expect(result.code).toContain("const a = 1");
    expect(result.code).not.toContain(": number");
  });

  it("memoizes the transform instance", () => {
    expect(getTransform()).toBe(getTransform());
  });
});

describe("loadOxc — native require workaround premise", () => {
  // The loader relies on `process.getBuiltinModule('module')` exposing the real
  // `createRequire`, which sidesteps CJS sandboxes (e.g. jest) that patch the
  // module loader so a plain `require()` of an ESM-only package fails. Document
  // and guard that premise here.
  it('process.getBuiltinModule("module") yields createRequire', () => {
    const getBuiltinModule = (
      process as { getBuiltinModule?: (id: string) => unknown }
    ).getBuiltinModule;
    expect(typeof getBuiltinModule).toBe("function");
    const mod = (
      getBuiltinModule as (id: string) => { createRequire?: unknown }
    )("module");
    expect(typeof mod.createRequire).toBe("function");
  });

  it("loads the genuine ESM-only oxc packages (not empty namespaces)", () => {
    // A broken loader (empty namespace) would not expose these APIs.
    expect(getParser().parseSync).toBeDefined();
    expect(getTransform().transformSync).toBeDefined();
  });
});
