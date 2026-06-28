/* eslint-disable */
// Benchmark: old @swc/core wasm-plugin extraction vs new oxc extraction.
//
//   node bench/benchmark.cjs [iterations]
//
// The old path is installed (isolated) under bench/.old — see bench/README.
const path = require("node:path");
const { createRequire } = require("node:module");

const ITERATIONS = Number(process.argv[2] || 500);

// New (this package, built to dist).
const { extraction: newExtraction } = require("../dist/index.cjs");

// Old (published @navita/swc@0.1.0 + @swc/core@1.3.63, installed in bench/.old).
const oldRequire = createRequire(path.join(__dirname, ".old/package.json"));
const { extraction: oldExtraction } = oldRequire("@navita/swc");

const importMap = [
  { callee: "style", source: "@navita/css" },
  { callee: "globalStyle", source: "@navita/css" },
  { callee: "createTheme", source: "@navita/css" },
];

const fixtures = [
  `import { style } from "@navita/css";
   export const unused = true;
   export const tests = style({ color: 'red' });
   const something = style({ color: 'green' });`,
  `import { style } from "@navita/css";
   import { someImport } from "some-other-place";
   console.log(someImport);`,
  `import { globalStyle } from "@navita/css";
   globalStyle('body', { fontSize: '50px' });`,
  `import { globalStyle, style } from "@navita/css";
   globalStyle('body', { color: 'purple' });
   const yellow = style({ background: 'yellow' });`,
  `import { globalStyle, createTheme, style as supercool } from "@navita/css";
   const preserved = 'hello';
   export const [vars] = createTheme({ color: { red: 'purple', value: preserved } });
   const [hej, hejsan, tja] = [1, 2, 3];
   globalStyle('body', { color: vars.color.red, hej, hejsan, tja });
   function hoisted(argName) { const wow = supercool({ color: 'blue', background: argName }); }
   const also = () => { const hoistedAgain = supercool({ color: 'blue', background: 'red' }); };`,
];

async function run(extraction) {
  for (let i = 0; i < fixtures.length; i++) {
    await extraction(fixtures[i], {
      filename: `file-${i}.tsx`,
      importMap,
      entryPoint: true,
    });
  }
}

async function time(label, extraction, iterations) {
  // Warm up (the old path JIT-compiles + caches the wasm plugin on first run).
  for (let i = 0; i < 20; i++) await run(extraction);

  const perOp = [];
  for (let i = 0; i < iterations; i++) {
    const start = process.hrtime.bigint();
    await run(extraction);
    const end = process.hrtime.bigint();
    perOp.push(Number(end - start) / 1e6 / fixtures.length); // ms per single extraction
  }
  perOp.sort((a, b) => a - b);
  const median = perOp[Math.floor(perOp.length / 2)];
  const mean = perOp.reduce((a, b) => a + b, 0) / perOp.length;
  const min = perOp[0];
  console.log(
    `${label.padEnd(8)} median=${median.toFixed(4)}ms  mean=${mean.toFixed(4)}ms  min=${min.toFixed(4)}ms  (per extraction, ${iterations * fixtures.length} runs)`,
  );
  return median;
}

(async () => {
  // Sanity: outputs of both paths should evaluate to the same styles (validated
  // by the test-suite); here we just confirm both produce non-empty output.
  const a = await newExtraction(fixtures[0], {
    filename: "f.tsx",
    importMap,
    entryPoint: true,
  });
  const b = await oldExtraction(fixtures[0], {
    filename: "f.tsx",
    importMap,
    entryPoint: true,
  });
  if (!a.includes("collectResult") || !b.includes("collectResult")) {
    throw new Error("sanity check failed");
  }

  console.log(
    `\nBenchmark — ${ITERATIONS} iterations x ${fixtures.length} fixtures\n`,
  );
  const oldMedian = await time("OLD swc", oldExtraction, ITERATIONS);
  const newMedian = await time("NEW oxc", newExtraction, ITERATIONS);
  const ratio = oldMedian / newMedian;
  console.log(
    `\nSpeedup (median): NEW is ${ratio.toFixed(2)}x ${ratio >= 1 ? "faster" : "slower"} than OLD\n`,
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
