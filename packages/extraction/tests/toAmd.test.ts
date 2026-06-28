import { esmToAmd } from "../src/toAmd";

const toAmd = (code: string, drop = false) =>
  esmToAmd(code, { dropUnusedImports: drop });

// AMD define() output with no module imports (only require/exports deps).
const noImp = (body: string) =>
  `define(["require", "exports"], function (require, exports) {\n${body}\n})`;
// AMD define() output with exactly one imported module bound to _navita_import_0.
const oneImp = (source: string, body: string) =>
  `define(["require", "exports", ${JSON.stringify(source)}], function (require, exports, _navita_import_0) {\n${body}\n})`;

/**
 * Minimal AMD runtime: evaluate the produced `define([...], function (...) {})`
 * expression against a module table and return the populated `exports`. Proves
 * the generated interop/re-export code actually behaves correctly at runtime,
 * not just textually.
 */
function runAmd(
  out: string,
  modules: Record<string, unknown> = {},
): Record<string, unknown> {
  const define = (deps: string[], factory: (...args: unknown[]) => void) => {
    const exports: Record<string, unknown> = {};
    const requireFn = (id: string) => modules[id];
    const args = deps.map((dep) => {
      if (dep === "require") return requireFn;
      if (dep === "exports") return exports;
      return modules[dep];
    });
    factory(...args);
    return exports;
  };
  // eslint-disable-next-line no-new-func
  const fn = new Function("define", `return (${out});`);
  return fn(define) as Record<string, unknown>;
}

describe("esmToAmd — export declaration forms", () => {
  it("export const declaration assigns to exports", () => {
    expect(toAmd(`export const a = 1;`)).toBe(
      noImp(`const a = 1;\nexports.a = a;`),
    );
  });

  it("export const with multiple declarators exports each name", () => {
    expect(toAmd(`export const a = 1, b = 2;`)).toBe(
      noImp(`const a = 1, b = 2;\nexports.a = a;\nexports.b = b;`),
    );
  });

  it("export function declaration", () => {
    expect(toAmd(`export function f() { return 1; }`)).toBe(
      noImp(`function f() { return 1; }\nexports.f = f;`),
    );
  });

  it("export { a, b as c } with no source uses local/exported names", () => {
    const out = toAmd(`const a = 1;\nconst b = 2;\nexport { a, b as c };`);
    expect(out).toBe(
      noImp(`const a = 1;\nconst b = 2;\nexports.a = a;\nexports.c = b;`),
    );
    const exports = runAmd(out);
    expect(exports).toEqual({ a: 1, c: 2 });
  });

  it('export { a, b as c } from "x" pulls off the required namespace', () => {
    const out = toAmd(`export { a, b as c } from "x";`);
    expect(out).toBe(
      noImp(
        `const _navita_reexport_0 = require("x");\n` +
          `exports.a = _navita_reexport_0.a;\n` +
          `exports.c = _navita_reexport_0.b;`,
      ),
    );
    const exports = runAmd(out, { x: { a: "A", b: "B" } });
    expect(exports).toEqual({ a: "A", c: "B" });
  });

  it('export * from "x" copies all keys except default', () => {
    const out = toAmd(`export * from "x";`);
    expect(out).toBe(
      noImp(
        `const _navita_reexport_0 = require("x");\n` +
          `for (const _k in _navita_reexport_0) { if (_k !== "default") exports[_k] = _navita_reexport_0[_k]; }`,
      ),
    );
    const exports = runAmd(out, {
      x: { foo: 1, bar: 2, default: "should-be-skipped" },
    });
    expect(exports).toEqual({ foo: 1, bar: 2 });
  });

  it('export * as ns from "x" binds the whole namespace', () => {
    const out = toAmd(`export * as ns from "x";`);
    expect(out).toBe(
      noImp(
        `const _navita_reexport_0 = require("x");\n` +
          `exports.ns = _navita_reexport_0;`,
      ),
    );
    const mod = { foo: 1, default: 2 };
    const exports = runAmd(out, { x: mod });
    expect(exports.ns).toBe(mod);
  });
});

describe("esmToAmd — export default forms", () => {
  it("export default named function (hoists decl, then assigns)", () => {
    expect(toAmd(`export default function foo() { return 1; }`)).toBe(
      noImp(`function foo() { return 1; }\nexports.default = foo;`),
    );
  });

  it("export default anonymous function (inline expression)", () => {
    expect(toAmd(`export default function () { return 1; }`)).toBe(
      noImp(`exports.default = function () { return 1; };`),
    );
  });

  it("export default named class (hoists decl, then assigns)", () => {
    expect(toAmd(`export default class Foo {}`)).toBe(
      noImp(`class Foo {}\nexports.default = Foo;`),
    );
  });

  it("export default anonymous class (inline expression)", () => {
    expect(toAmd(`export default class {}`)).toBe(
      noImp(`exports.default = class {};`),
    );
  });

  it("export default arbitrary expression", () => {
    const out = toAmd(`const x = 1;\nexport default x + 2;`);
    expect(out).toBe(noImp(`const x = 1;\nexports.default = x + 2;`));
    expect(runAmd(out).default).toBe(3);
  });
});

describe("esmToAmd — import interop", () => {
  it("namespace import binds the module object directly", () => {
    const out = toAmd(`import * as ns from "x";\nconsole.log(ns.foo);`);
    expect(out).toBe(
      oneImp("x", `const ns = _navita_import_0;\nconsole.log(ns.foo);`),
    );
    const mod = { foo: "bar" };
    const exports = runAmd(
      toAmd(`import * as ns from "x";\nexport const v = ns.foo;`),
      { x: mod },
    );
    expect(exports.v).toBe("bar");
  });

  it("named import destructures off the module param", () => {
    expect(toAmd(`import { a, b as c } from "x";\nconsole.log(a, c);`)).toBe(
      oneImp("x", `const { a, b: c } = _navita_import_0;\nconsole.log(a, c);`),
    );
  });

  it("mixed default + named import emits both interop and destructure", () => {
    expect(
      toAmd(`import def, { a, b as c } from "x";\nconsole.log(def, a, c);`),
    ).toBe(
      oneImp(
        "x",
        `const def = _navita_import_0 && _navita_import_0.__esModule ? _navita_import_0.default : (_navita_import_0.default !== undefined ? _navita_import_0.default : _navita_import_0);\n` +
          `const { a, b: c } = _navita_import_0;\n` +
          `console.log(def, a, c);`,
      ),
    );
  });

  it("default import: ESM (__esModule) reads .default", () => {
    const out = toAmd(`import dep from "x";\nexport const v = dep;`);
    const exports = runAmd(out, { x: { __esModule: true, default: "esm" } });
    expect(exports.v).toBe("esm");
  });

  it("default import: CJS object with .default reads .default", () => {
    const out = toAmd(`import dep from "x";\nexport const v = dep;`);
    const exports = runAmd(out, { x: { default: 42 } });
    expect(exports.v).toBe(42);
  });

  it("default import: CJS without __esModule or .default falls back to the module itself", () => {
    const out = toAmd(`import dep from "x";\nexport const v = dep;`);
    const cjs = { notDefault: "cjs" };
    const exports = runAmd(out, { x: cjs });
    expect(exports.v).toBe(cjs);
  });
});

describe("esmToAmd — side-effect-only imports", () => {
  it("keeps the side-effect dependency when not pruning (entryPoint:false)", () => {
    const out = toAmd(`import "x";\nconsole.log(1);`, false);
    expect(out).toBe(
      `define(["require", "exports", "x"], function (require, exports, _navita_side_0) {\nconsole.log(1);\n})`,
    );
  });

  it("drops the side-effect dependency when pruning (entry point)", () => {
    const out = toAmd(`import "x";\nconsole.log(1);`, true);
    expect(out).toBe(noImp(`console.log(1);`));
  });

  it("side-effect dependency is actually loaded only when kept", () => {
    const kept = toAmd(`import "x";\nexport const ok = 1;`, false);
    let loadedKept = false;
    runAmd(kept, {
      get x() {
        loadedKept = true;
        return {};
      },
    } as Record<string, unknown>);
    expect(loadedKept).toBe(true);

    const dropped = toAmd(`import "x";\nexport const ok = 1;`, true);
    let loadedDropped = false;
    runAmd(dropped, {
      get x() {
        loadedDropped = true;
        return {};
      },
    } as Record<string, unknown>);
    expect(loadedDropped).toBe(false);
  });
});

describe("esmToAmd — re-export namespace counter (C10)", () => {
  it("numbers multiple re-exports within one call deterministically", () => {
    const out = toAmd(`export { a } from "x";\nexport * from "y";`);
    expect(out).toBe(
      noImp(
        `const _navita_reexport_0 = require("x");\n` +
          `exports.a = _navita_reexport_0.a;\n` +
          `const _navita_reexport_1 = require("y");\n` +
          `for (const _k in _navita_reexport_1) { if (_k !== "default") exports[_k] = _navita_reexport_1[_k]; }`,
      ),
    );
  });

  it("resets the counter per call — repeated conversions are identical", () => {
    const code = `export { a } from "x";`;
    const first = toAmd(code);
    const second = toAmd(code);
    // Both must start re-export numbering at 0 (regression guard for the former
    // module-global counter that produced _navita_reexport_1 on the 2nd call).
    expect(first).toContain("_navita_reexport_0");
    expect(first).not.toContain("_navita_reexport_1");
    expect(second).toBe(first);
  });

  it("isolates the counter even across export-all and named re-exports", () => {
    const a = toAmd(`export * from "x";`);
    const b = toAmd(`export * as ns from "y";`);
    expect(a).toContain("_navita_reexport_0");
    expect(b).toContain("_navita_reexport_0");
  });
});
