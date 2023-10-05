import { generateIdentifier, addStaticCss } from "@navita/adapter";
import type { MapLeafNodes, NullableTokens, ThemeVars, Tokens, Contract  } from "@navita/types";
import cssesc from "cssesc";
import { walkObject } from "./helpers/walkObject";
import { assignVars, createVar } from "./vars";

export function createThemeContract<ThemeTokens extends NullableTokens>(
  tokens: ThemeTokens,
): ThemeVars<ThemeTokens> {
  return walkObject(tokens, (_value, path) => {
    return `var(${createVar(path.join('-').toLowerCase())})`;
  });
}

export function createGlobalThemeContract<ThemeTokens extends Tokens>(
  tokens: ThemeTokens,
): ThemeVars<ThemeTokens>;
export function createGlobalThemeContract<ThemeTokens extends NullableTokens>(
  tokens: ThemeTokens,
  mapFn: (value: string | null, path: Array<string>) => string,
): ThemeVars<ThemeTokens>;
export function createGlobalThemeContract(
  tokens: Tokens | NullableTokens,
  mapFn?: (value: string | null, path: Array<string>) => string,
) {
  return walkObject(tokens, (value, path) => {
    const rawVarName =
      typeof mapFn === 'function'
        ? mapFn(value as string | null, path)
        : (value as string);

    const varName =
      typeof rawVarName === 'string' ? rawVarName.replace(/^--/, '') : null;

    if (
      typeof varName !== 'string' ||
      varName !== cssesc(varName, { isIdentifier: true })
    ) {
      throw new Error(
        `Invalid variable name for "${path.join('.')}": ${varName}`,
      );
    }

    return `var(--${varName})`;
  });
}

export function createGlobalTheme<ThemeTokens extends Tokens>(
  selector: string,
  tokens: ThemeTokens,
): ThemeVars<ThemeTokens>;
export function createGlobalTheme<ThemeContract extends Contract>(
  selector: string,
  themeContract: ThemeContract,
  tokens: MapLeafNodes<ThemeContract, string>,
): void;
export function createGlobalTheme(
  selector: string,
  arg2: any,
  arg3?: any,
): any {
  const shouldCreateVars = Boolean(!arg3);

  const themeVars = shouldCreateVars
    ? createThemeContract(arg2)
    : (arg2 as ThemeVars<any>);

  const tokens = shouldCreateVars ? arg2 : arg3;

  const temp = assignVars(themeVars, tokens);

  addStaticCss(selector, temp);

  if (shouldCreateVars) {
    return themeVars;
  }
}

export function createTheme<ThemeTokens extends Tokens>(
  tokens: ThemeTokens,
  debugId?: string,
): [className: string, vars: ThemeVars<ThemeTokens>];
export function createTheme<ThemeContract extends Contract>(
  themeContract: ThemeContract,
  tokens: MapLeafNodes<ThemeContract, string>,
): string;
export function createTheme(arg1: any, arg2?: any): any {
  const themeClassName = generateIdentifier(
    typeof arg2 === 'object' ? arg2 : arg1,
  );

  const vars =
    typeof arg2 === 'object'
      ? createGlobalTheme(`.${themeClassName}`, arg1, arg2)
      : createGlobalTheme(`.${themeClassName}`, arg1);

  return vars ? [themeClassName, vars] : themeClassName;
}
