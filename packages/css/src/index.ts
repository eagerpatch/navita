export { style } from './style';
export { globalStyle } from './globalStyle';
export { merge } from './merge';
export { keyframes } from './keyframes';
export { fontFace } from './fontFace';
export { createTheme, createGlobalTheme, createGlobalThemeContract, createThemeContract } from './theme';
export { assignVars, createVar, fallbackVar } from './vars';
export type * from '@navita/types';
const source = '@navita/css';
export const importMap = [
  {
    callee: "style",
    source,
  },
  {
    callee: "globalStyle",
    source,
  },
  {
    callee: "keyframes",
    source,
  },
  {
    callee: "fontFace",
    source,
  },
  {
    callee: "createThemeContract",
    source,
  },
  {
    callee: "createGlobalThemeContract",
    source,
  },
  {
    callee: "createGlobalTheme",
    source,
  },
  {
    callee: "createTheme",
    source,
  },
  {
    callee: "createVar",
    source,
  },
  {
    callee: "fallbackVar",
    source,
  }
];
