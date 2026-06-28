export type * from '@navita/types';
export { fontFace } from './fontFace';
export { globalStyle } from './globalStyle';
export { keyframes } from './keyframes';
export { merge } from './merge';
export { style } from './style';
export {
  createGlobalTheme,
  createGlobalThemeContract,
  createTheme,
  createThemeContract,
} from './theme';
export { assignVars, createVar, fallbackVar } from './vars';

const source = '@navita/css';
export const importMap = [
  {
    callee: 'style',
    source,
  },
  {
    callee: 'globalStyle',
    source,
  },
  {
    callee: 'keyframes',
    source,
  },
  {
    callee: 'fontFace',
    source,
  },
  {
    callee: 'createThemeContract',
    source,
  },
  {
    callee: 'createGlobalThemeContract',
    source,
  },
  {
    callee: 'createGlobalTheme',
    source,
  },
  {
    callee: 'createTheme',
    source,
  },
  {
    callee: 'createVar',
    source,
  },
  {
    callee: 'fallbackVar',
    source,
  },
];
