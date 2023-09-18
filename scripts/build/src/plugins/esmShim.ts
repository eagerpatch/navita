import MagicString from "magic-string";
import type { Plugin } from "rollup";

export function esmShim(): Plugin {
  return {
    name: "esm-shim",
    renderChunk(code, _chunk, opts) {
      if (opts.format !== 'es') {
        return null;
      }

      const shims = [];

      if (code.indexOf('__dirname') !== -1) {
        shims.push(dirnameShim(code));
      } else if (code.indexOf('__filename') !== -1) {
        shims.push(filenameShim(code));
      }

      if (code.indexOf('require(') !== -1 || code.indexOf('require.resolve(') !== -1) {
        shims.push(requireShim(code));
      }

      if (shims.length === 0) {
        return null;
      }

      const result = new MagicString(code);
      result.appendRight(0, shims.join('\n') + '\n');

      return {
        code: result.toString(),
        map: result.generateMap(),
      };
    },
  } as Plugin;
}

function filenameShim(code: string) {
  const importName = findUniqueImportName(code, 'fileURLToPath');
  return [
    `import { fileURLToPath as ${importName} } from 'url';`,
    `const __filename = ${importName}(import.meta.url);`,
  ].join('\n');
}

function dirnameShim(code: string) {
  const importName = findUniqueImportName(code, 'dirname');
  return [
    filenameShim(code),
    `import { dirname as ${importName} } from 'path';`,
    `const __dirname = ${importName}(__filename);`
  ].join('\n');
}

function requireShim(code: string) {
  const importName = findUniqueImportName(code, 'createRequire');
  return [
    `import { createRequire as ${importName} } from 'module';`,
    `const require = ${importName}(import.meta.url);`
  ].join('\n');
}

function findUniqueImportName(code: string, baseName: string): string {
  const importName = baseName;
  let counter = 1;

  while (code.indexOf(`${importName}$${counter}`) !== -1) {
    counter++;
  }

  return `${importName}$${counter}`;
}
