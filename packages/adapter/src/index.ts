import type { CSSKeyframes, GlobalStyleRule, StyleRule, FontFaceRule } from "@navita/types";

export type Adapter = {
  generateIdentifier: typeof generateIdentifier,
  addCss: typeof addCss,
  addStaticCss: typeof addStaticCss,
  addKeyframe: typeof addKeyframe,
  addFontFace: typeof addFontFace,
  collectResult?: typeof collectResult;
};

let adapter: Adapter | undefined = undefined;

function getAdapter() {
  if (!adapter) {
    throw new Error(
      'Could not find an adapter. Please ensure you have added a bundler integration:\n' +
      'https://navita.style/#bundler-integration',
    );
  }

  return adapter;
}

export const setAdapter = (newAdapter: Adapter) => {
  adapter = newAdapter;
}

export function generateIdentifier(value: unknown): string {
  return getAdapter().generateIdentifier(value) as string;
}

export function addCss(css: StyleRule): string {
  return getAdapter().addCss(css);
}

export function addStaticCss(selector: string, css: GlobalStyleRule): void {
  return getAdapter().addStaticCss(selector, css);
}

export function addKeyframe(keyframe: CSSKeyframes): string {
  return getAdapter().addKeyframe(keyframe) as string;
}

export function addFontFace(fontFace: FontFaceRule | FontFaceRule[]): string {
  return getAdapter().addFontFace(fontFace) as string;
}

type Start = number;
type End = number;
type Position = [Start, End];

export function collectResult<T>(input: {
  filePath: string,
  index: number,
  result: () => T,
  identifier: string,
  position: Position,
  sourceMap: {
    line: number,
    column: number,
  },
}): T {
  return getAdapter().collectResult?.(input) as T;
}
