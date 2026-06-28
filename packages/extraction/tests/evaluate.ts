import * as adapter from "@navita/adapter";
import { setAdapter } from "@navita/adapter";
import * as css from "@navita/css";
import * as engine from "@navita/engine";
import { ClassList, Engine } from "@navita/engine";
import type { ImportMap } from "@navita/types";
import { extraction } from "../src/extraction";

/**
 * The extracted AMD module `require()`s navita packages by source. Resolve those
 * to the ESM instances this test already imports so the adapter the test wires
 * (via `setAdapter`) is the same one the extracted code observes. Falling back to
 * the runtime `require` would load the CJS build — a separate module instance
 * whose adapter is never set ("Could not find an adapter").
 */
const knownModules: Record<string, unknown> = {
  "@navita/adapter": adapter,
  "@navita/css": css,
  "@navita/engine": engine,
};

export type EvalResult = {
  output: string;
  css: string;
  results: { start: number; end: number; value: string }[];
  exports: Record<string, unknown>;
};

/**
 * Wire @navita/adapter to a fresh engine (mirrors @navita/core's setAdapter).
 */
function wireAdapter(
  engine: Engine,
  resultCache: Record<string, any[]>,
  filePath: string,
) {
  setAdapter({
    generateIdentifier: (value: any) => engine.generateIdentifier(value),
    addStaticCss: (selector: string, css: any) =>
      engine.addStatic(selector, css) as any,
    addCss: (css: any) => engine.addStyle(css) as any,
    addKeyframe: (keyframe: any) => engine.addKeyframes(keyframe),
    addFontFace: (fontFace: any) => engine.addFontFace(fontFace),
    collectResult({
      index,
      filePath: fp,
      result: resultFactory,
      position,
    }: any) {
      engine.setFilePath(fp);
      const result = resultFactory();
      engine.setFilePath(undefined);
      if (!resultCache[fp]) resultCache[fp] = [];
      const [start, end] = position;
      resultCache[fp][index] = {
        start,
        end,
        value: result === undefined ? "undefined" : JSON.stringify(result),
      };
      return result;
    },
  } as any);
}

/**
 * Run extraction on `code`, then evaluate the produced AMD module against a real
 * engine + adapter and return the collected CSS / results / exports.
 *
 * Module sources (`@navita/css`, `@navita/adapter`, ...) are resolved with the
 * test's own require.
 */
export async function evaluate(
  code: string,
  options: {
    filename?: string;
    importMap?: ImportMap;
    entryPoint?: boolean;
    extraModules?: Record<string, any>;
  } = {},
): Promise<EvalResult> {
  const filePath = options.filename ?? "/virtual/entry.tsx";
  const importMap = options.importMap ?? [
    { source: "@navita/css", callee: "style" },
    { source: "@navita/css", callee: "globalStyle" },
    { source: "@navita/css", callee: "createTheme" },
    { source: "@navita/css", callee: "createGlobalTheme" },
    { source: "@navita/css", callee: "keyframes" },
  ];

  const output = await extraction(code, {
    filename: filePath,
    importMap,
    entryPoint: options.entryPoint ?? true,
  });

  const engine = new Engine();
  const resultCache: Record<string, any[]> = {};
  wireAdapter(engine, resultCache, filePath);

  const extraModules = options.extraModules ?? {};

  const resolveDep = (id: string) => {
    if (id in extraModules) return extraModules[id];
    if (id in knownModules) return knownModules[id];
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(id);
  };

  const define = (deps: string[], factory: (...args: any[]) => void) => {
    const exports: Record<string, unknown> = {};
    const args = deps.map((dep) => {
      if (dep === "require") return resolveDep;
      if (dep === "exports") return exports;
      return resolveDep(dep);
    });
    factory(...args);
    return { exports };
  };

  // eslint-disable-next-line no-new-func
  const fn = new Function("define", "require", `return (${output});`);
  const { exports } = fn(define, require);

  return {
    output,
    css: engine.renderCssToString(),
    results: resultCache[filePath] || [],
    exports,
  };
}

export { ClassList };
