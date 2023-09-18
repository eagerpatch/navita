import vm from "vm";
import { createMagicProxy } from "./magicProxy";

const context = vm.createContext({ global });

const vmGlobalsRecord = new vm.Script(`
Object
  .getOwnPropertyNames(globalThis)
  .reduce((acc, name) => ({
    ...acc,
    [name]: globalThis[name],
  }), {});
`).runInContext(context) as Record<string, unknown>;

const vmGlobalsNonEnumerableRecord = {};

Object.getOwnPropertyNames(global).forEach((name) => {
  // The second condition here is to prevent jest's Symbol polyfill from being added.
  // https://github.com/jestjs/jest/blob/25a8785584c9d54a05887001ee7f498d489a5441/packages/jest-util/src/installCommonGlobals.ts#L49
  if (!vmGlobalsRecord[name] && global[name] !== globalThis.Symbol) {
    vmGlobalsNonEnumerableRecord[name] = global[name];
  }
});

export function createCompiledFunction<Return>(
  source: string,
  define: (deps: string[], handlerFn: (...args) => void) => Return,
) {
  // This looks a bit weird, but it's much quicker to do it this way than to
  // run vm.runInContext. There's a bit more information in this issue:
  // https://github.com/nodejs/node/issues/31658
  const sandbox = {
    define,
    ...vmGlobalsRecord,
    ...vmGlobalsNonEnumerableRecord,
    window: createMagicProxy(),
    document: createMagicProxy(),
    navigator: createMagicProxy(),
    console,
  };

  const params = Object.keys(sandbox);
  const implementations = Object.values(sandbox);

  const compiledFunction = vm.compileFunction(source, params, {
    parsingContext: context,
  });

  return () => compiledFunction(...implementations) as Return;
}
