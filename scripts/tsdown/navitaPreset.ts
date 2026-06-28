import * as fs from "node:fs";
import * as path from "node:path";
import type { Options } from "tsdown";
import { createPackageJson } from "./createPackageJson";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Replicates rollup-plugin-node-externals({ packagePath }) from the custom tool:
 * externalize EVERY declared dependency (deps + peers + optional + dev) and
 * their subpaths, in BOTH the JS and the dts build. (tsdown only externalizes
 * deps/peers by default — workspace devDeps like @navita/types and third-party
 * devDeps like `webpack` would otherwise be bundled, and CommonJS .d.ts such as
 * webpack's cannot be bundled by rolldown-plugin-dts.)
 */
function externalsFromPackageJson(cwd: string): RegExp[] {
  const pkg = JSON.parse(
    fs.readFileSync(path.resolve(cwd, "package.json"), "utf8"),
  );
  const names = new Set<string>([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.peerDependencies ?? {}),
    ...Object.keys(pkg.optionalDependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
  ]);
  return [...names].map(
    (name) => new RegExp(`^${escapeRegExp(name)}(?:/.*)?$`),
  );
}

export interface NavitaPresetOptions {
  /** Output formats. Default ['esm','cjs']. Use ['cjs'] for cjs-only packages. */
  format?: ("esm" | "cjs")[];
  /**
   * The export entry points that should get a rolled-up `.d.ts` (matches the
   * custom tool, which emitted ONE .d.ts per `exports` entry — not per file).
   * e.g. 'src/index.ts' or ['src/createRenderer.ts','src/evaluateAndProcess.ts'].
   * Omit for a types-only package (use navitaTypesPreset instead).
   */
  dtsEntry: string | string[];
}

const ROOT_README = () => path.resolve(process.cwd(), "../../README.md");

/**
 * Shared tsdown preset for navita packages. Replaces the custom rollup tool
 * (scripts/build). Returns a multi-pass config (one pass per JS format + 1 dts):
 *
 *   ESM pass: unbundle (file-per-module) .mjs, shims:true (ESM __dirname).
 *   CJS pass: unbundle (file-per-module) .cjs, shims:false (native dirname/require).
 *   dts pass: bundle (rolled-up) → ONE `.d.ts` per export entry.
 *
 * This reproduces the custom tool's exact output shape (a single rolled-up
 * `.d.ts` per export entry, extension-agnostic so a single `types` condition
 * serves both import & require), while keeping the source `exports.types`
 * pointing at `./src/*.ts` for in-monorepo dev (no build needed for types). The
 * publish-from-dist rewrite maps `.ts -> .d.ts`.
 */
export function navitaPreset(opts: NavitaPresetOptions): Options[] {
  const { format = ["esm", "cjs"], dtsEntry } = opts;
  const neverBundle = externalsFromPackageJson(process.cwd());

  const jsBase: Options = {
    entry: ["src/**/*.{ts,tsx}"], // all src modules
    unbundle: true, // file-per-module (core evaluates modules at runtime)
    fixedExtension: true, // .mjs / .cjs
    platform: "node",
    dts: false,
    deps: { neverBundle, dts: { neverBundle } },
  };

  // IMPORTANT: ESM and CJS MUST be separate single-format passes.
  // With unbundle:true, tsdown's `shims:true` is NOT format-gated, so the ESM
  // `import ...`/`import.meta.url` shim banner would leak into .cjs and make
  // the CJS build unloadable. So we enable `shims` ONLY on the ESM pass; CJS
  // has native __dirname/require.
  const passes: Options[] = [];

  if (format.includes("esm")) {
    passes.push({
      ...jsBase,
      format: ["esm"],
      shims: true, // __dirname/__filename shim (ESM only)
    });
  }
  if (format.includes("cjs")) {
    passes.push({
      ...jsBase,
      format: ["cjs"],
      shims: false, // CJS: native __dirname/require (rolldown emits __require too)
    });
  }

  // The dts pass: bundle (rolled-up) → ONE `.d.ts` per export entry.
  passes.push({
    entry: dtsEntry,
    unbundle: false, // bundle → rolled-up single .d.ts per entry (matches custom)
    format: ["esm"], // single dts pass (no collision => safe to force .d.ts)
    platform: "node",
    dts: { emitDtsOnly: true }, // types only; no JS from this pass
    // Force a plain `.d.ts` regardless of package `type`/format. Safe because
    // this pass emits a single format.
    outExtensions: () => ({ dts: ".d.ts" }),
    deps: { neverBundle, dts: { neverBundle } },
    copy: [{ from: ROOT_README() }], // root README into each dist
    // publish-from-dist package.json rewrite (runs last)
    hooks: {
      "build:done": async () => {
        await createPackageJson(process.cwd());
      },
    },
  });

  // First pass cleans the dist; later passes must not wipe it.
  passes.forEach((p, i) => {
    p.clean = i === 0;
  });

  return passes;
}

/**
 * Types-only packages (@navita/types) have no runtime code. The cleanest match
 * for the custom tool (which produced a single rolled-up index.d.ts) is a
 * bundled dts-only pass plus README copy + package.json rewrite.
 */
export function navitaTypesPreset(
  dtsEntry: string | string[] = "src/index.ts",
): Options {
  const neverBundle = externalsFromPackageJson(process.cwd());
  return {
    entry: dtsEntry,
    unbundle: false,
    format: ["esm"],
    platform: "node",
    dts: { emitDtsOnly: true },
    outExtensions: () => ({ dts: ".d.ts" }),
    clean: true,
    deps: { neverBundle, dts: { neverBundle } },
    copy: [{ from: ROOT_README() }],
    hooks: {
      "build:done": async () => {
        await createPackageJson(process.cwd());
      },
    },
  };
}
