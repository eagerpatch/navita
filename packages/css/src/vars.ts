import { generateIdentifier } from "@navita/adapter";
import type { Contract, CSSVarFunction, MapLeafNodes } from "@navita/types";
import cssesc from 'cssesc';
import { walkObject } from "./helpers/walkObject";
import { validateContract } from "./validateContract";

export function createVar(name: string) {
  if (!name) {
    return `var(--${generateIdentifier(undefined)})`;
  }

  return `var(--${cssesc(name, { isIdentifier: true })})`;
}

export function fallbackVar(
  ...values: [string, ...Array<string>]
): CSSVarFunction {
  let finalValue = '';

  values.reverse().forEach((value) => {
    if (finalValue === '') {
      finalValue = String(value);
    } else {
      if (typeof value !== 'string' || !/^var\(--.*\)$/.test(value)) {
        throw new Error(`Invalid variable name: ${value}`);
      }

      finalValue = value.replace(/\)$/, `, ${finalValue})`);
    }
  });

  return finalValue as CSSVarFunction;
}

export function assignVars<VarContract extends Contract>(
  varContract: VarContract,
  tokens: MapLeafNodes<VarContract, string>,
): Record<CSSVarFunction, string> {
  const varSetters: { [cssVarName: string]: string } = {};
  const { valid, diffString } = validateContract(varContract, tokens);

  if (!valid) {
    throw new Error(`Tokens don't match contract.\n${diffString}`);
  }

  walkObject(tokens, (value, path) => {
    const cssVarWithoutVar = `--${cssesc(path.join('-').toLowerCase(), { isIdentifier: true })}`;
    varSetters[cssVarWithoutVar] = String(value);
  });

  return varSetters;
}
