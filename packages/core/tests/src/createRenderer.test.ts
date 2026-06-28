import * as fs from "node:fs";
import path from "node:path";
import type { UsedIdCache } from "@navita/engine";
import { createRenderer } from "../../src/createRenderer";

/**
 * Integration tests for the public `createRenderer().transformAndProcess`
 * surface: MagicString reverse-`update` substitution, the returned
 * `dependencies` / `usedIds` / `sourceMap`, `clearCache`, and per-renderer cache
 * isolation (C7).
 */
describe("createRenderer", () => {
  // Place virtual files OUTSIDE packages/core. evaluateAndProcess treats anything
  // under the core package root (or node_modules) as "external", so files placed
  // there would never be evaluated. The repo root keeps them in-scope.
  const fakedBasePath = path.resolve(__dirname, "../../../../");

  const importMap = [
    { source: "@navita/css", callee: "style" },
    { source: "@navita/css", callee: "createGlobalTheme" },
  ];

  const toPath = (name: string) => path.resolve(fakedBasePath, name);

  function makeRenderer(files: Record<string, string> = {}) {
    const resolvedFiles = Object.entries(files).reduce(
      (acc, [name, content]) => {
        acc[toPath(name)] = content;
        return acc;
      },
      {} as Record<string, string>,
    );

    const renderer = createRenderer({
      importMap,
      readFile: async (filePath: string) =>
        resolvedFiles[filePath] ??
        (await fs.promises.readFile(filePath, "utf-8")),
      resolver: async (_filePath: string, request: string) => {
        const base = path.resolve(
          fakedBasePath,
          request.replace(/^\.\//, "").replace(/^~\//, ""),
        );

        for (const candidate of [base, `${base}.ts`, `${base}.js`]) {
          if (resolvedFiles[candidate]) {
            return candidate;
          }
        }

        return require.resolve(request);
      },
    });

    return { renderer, resolvedFiles };
  }

  const countUsedIds = (cache: UsedIdCache) =>
    Object.values(cache).reduce((total, ids) => total + ids.length, 0);

  it("replaces a style() call with its generated class name and renders the CSS", async () => {
    const content = [
      "import { style } from '@navita/css';",
      "export const a = style({ color: 'red' });",
      "",
    ].join("\n");

    const { renderer } = makeRenderer();
    const filePath = toPath("single.ts");

    const output = await renderer.transformAndProcess({ content, filePath });

    expect(output.result).toContain('export const a = "a1"');
    expect(output.result).not.toContain("style({");
    expect(output.dependencies).toEqual([]);
    expect(renderer.engine.renderCssToString()).toBe(".a1{color:red}");
  });

  it("applies multiple replacements through MagicString reverse-update without offset drift", async () => {
    const content = [
      "import { style } from '@navita/css';",
      "export const a = style({ color: 'red' });",
      "export const b = style({ color: 'blue' });",
      "",
    ].join("\n");

    const { renderer } = makeRenderer();
    const filePath = toPath("multi.ts");

    const output = await renderer.transformAndProcess({ content, filePath });

    // Both substitutions land at their correct (un-shifted) offsets — the second
    // replacement would corrupt the first if updates were applied left-to-right
    // instead of in reverse.
    expect(output.result).toContain('export const a = "a1"');
    expect(output.result).toContain('export const b = "a2"');
    expect(renderer.engine.renderCssToString()).toBe(
      ".a1{color:red}.a2{color:blue}",
    );
  });

  it("returns resolved source dependencies and a source map", async () => {
    const content = [
      "import { style } from '@navita/css';",
      "import { background } from './colors';",
      "export const a = style({ background });",
      "",
    ].join("\n");

    const { renderer } = makeRenderer({
      "colors.ts": "export const background = 'red';",
    });
    const filePath = toPath("with-dep.ts");

    const output = await renderer.transformAndProcess({ content, filePath });

    expect(output.dependencies).toHaveLength(1);
    expect(output.dependencies[0].endsWith("colors.ts")).toBe(true);
    expect(output.result).toContain('export const a = "a1"');
    expect(renderer.engine.renderCssToString()).toBe(".a1{background:red}");

    // sourceMap is a real v3 map with non-trivial (encoded) mappings.
    expect(output.sourceMap).toBeDefined();
    expect(output.sourceMap.version).toBe(3);
    expect(typeof output.sourceMap.mappings).toBe("string");
    expect(output.sourceMap.mappings.length).toBeGreaterThan(0);
  });

  it("exposes usedIds for the processed file and clearCache resets them", async () => {
    const content = [
      "import { style } from '@navita/css';",
      "export const a = style({ color: 'red' });",
      "",
    ].join("\n");

    const { renderer } = makeRenderer();
    const filePath = toPath("clearable.ts");

    const output = await renderer.transformAndProcess({ content, filePath });

    expect(countUsedIds(output.usedIds)).toBeGreaterThan(0);
    expect(
      countUsedIds(renderer.engine.getCacheIds([filePath])),
    ).toBeGreaterThan(0);

    renderer.clearCache(filePath);

    expect(countUsedIds(renderer.engine.getCacheIds([filePath]))).toBe(0);
  });

  it("isolates caches between renderer instances (no cross-renderer leakage)", async () => {
    const content = [
      "import { style } from '@navita/css';",
      "export const a = style({ color: 'red' });",
      "",
    ].join("\n");

    // Same file path + identical source in two independent renderers.
    const filePath = toPath("shared-identity.ts");
    const { renderer: rendererA } = makeRenderer();
    const { renderer: rendererB } = makeRenderer();

    const outputA = await rendererA.transformAndProcess({ content, filePath });
    const outputB = await rendererB.transformAndProcess({ content, filePath });

    // If the module/result caches were shared process-globally, renderer B would
    // reuse renderer A's compiled module — which writes to A's engine — leaving
    // B's engine empty. Both engines must independently hold the extracted CSS.
    expect(rendererA.engine.renderCssToString()).toBe(".a1{color:red}");
    expect(rendererB.engine.renderCssToString()).toBe(".a1{color:red}");
    expect(outputA.result).toContain('export const a = "a1"');
    expect(outputB.result).toContain('export const a = "a1"');
    expect(
      countUsedIds(rendererA.engine.getCacheIds([filePath])),
    ).toBeGreaterThan(0);
    expect(
      countUsedIds(rendererB.engine.getCacheIds([filePath])),
    ).toBeGreaterThan(0);
  });
});
