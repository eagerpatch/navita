/**
 * The `oxc-parser` / `oxc-transform` packages ship as ESM. Node 22+ supports
 * `require()`-ing ESM, but some CommonJS sandboxes (notably jest's runtime)
 * patch the module loader so a plain `require` fails or returns an empty
 * namespace. Loading them through `module.createRequire` obtained from the
 * *builtin* module (via `process.getBuiltinModule`) uses Node's real loader and
 * works both at runtime and inside jest.
 */
type OxcParser = typeof import('oxc-parser');
type OxcTransform = typeof import('oxc-transform');

function getNativeRequire(): (id: string) => any {
  const builtin =
    typeof process !== 'undefined' &&
    typeof (process as any).getBuiltinModule === 'function'
      ? (process as any).getBuiltinModule('module')
      : // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('node:module');
  return builtin.createRequire(__filename);
}

let parser: OxcParser | undefined;
let transform: OxcTransform | undefined;

export function getParser(): OxcParser {
  if (!parser) {
    parser = getNativeRequire()('oxc-parser');
  }
  return parser as OxcParser;
}

export function getTransform(): OxcTransform {
  if (!transform) {
    transform = getNativeRequire()('oxc-transform');
  }
  return transform as OxcTransform;
}
