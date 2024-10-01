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

export function createCompiledFunction<Return>(
  source: string,
  define: (deps: string[], handlerFn: (...args: any[]) => void) => Return,
) {
  // This looks a bit weird, but it's much quicker to do it this way than to
  // run vm.runInContext. There's a bit more information in this issue:
  // https://github.com/nodejs/node/issues/31658
  const sandbox = {
    define,
    ...vmGlobalsRecord,
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
