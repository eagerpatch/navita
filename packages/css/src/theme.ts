import { addStaticCss, generateIdentifier } from "@navita/adapter";
import type {
  Contract,
  MapLeafNodes,
  NullableTokens,
  ThemeVars,
  Tokens,
} from "@navita/types";
import cssesc from "cssesc";
import { walkObject } from "./helpers/walkObject";
import { assignVars, createVar } from "./vars";

export function createThemeContract<ThemeTokens extends NullableTokens>(
  tokens: ThemeTokens,
): ThemeVars<ThemeTokens> {
  return walkObject(tokens, (_value, path) => {
    return `var(${createVar(path.join("-").toLowerCase())})`;
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
      typeof mapFn === "function"
        ? mapFn(value as string | null, path)
        : (value as string);

    const varName =
      typeof rawVarName === "string" ? rawVarName.replace(/^--/, "") : null;

    if (
      typeof varName !== "string" ||
      varName !== cssesc(varName, { isIdentifier: true })
    ) {
      throw new Error(
        `Invalid variable name for "${path.join(".")}": ${varName}`,
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
  arg2: Tokens | Contract,
  arg3?: MapLeafNodes<Contract, string>,
): ThemeVars<Tokens> | undefined {
  const shouldCreateVars = Boolean(!arg3);

  const themeVars = shouldCreateVars
    ? createThemeContract(arg2 as Tokens)
    : (arg2 as Contract);

  const tokens = shouldCreateVars ? arg2 : arg3;

  addStaticCss(
    selector,
    assignVars(
      themeVars as Contract,
      tokens as unknown as MapLeafNodes<Contract, string>,
    ),
  );

  if (shouldCreateVars) {
    return themeVars as ThemeVars<Tokens>;
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
export function createTheme(
  arg1: Tokens | Contract,
  arg2?: string | MapLeafNodes<Contract, string>,
): [className: string, vars: ThemeVars<Tokens>] | string {
  const themeClassName = generateIdentifier(
    typeof arg2 === "object" ? arg2 : arg1,
  );

  const vars =
    typeof arg2 === "object"
      ? createGlobalTheme(`.${themeClassName}`, arg1 as Contract, arg2)
      : createGlobalTheme(`.${themeClassName}`, arg1 as Tokens);

  return vars ? [themeClassName, vars] : themeClassName;
}
