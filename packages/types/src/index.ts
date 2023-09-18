import type { Properties, AtRule, SimplePseudos } from 'csstype';
import type { AdvancedPseudos } from "csstype";

export type ImportMap = {
  callee: string;
  source: string;
}[];

export type CSSVarFunction =
  | `var(--${string})`
  | `var(--${string}, ${string | number})`;

export type Contract = {
  [key: string]: CSSVarFunction | null | Contract;
};

type Primitive = string | boolean | number | null | undefined;

export type MapLeafNodes<Obj, LeafType> = {
  [Prop in keyof Obj]: Obj[Prop] extends Primitive
    ? LeafType
    : Obj[Prop] extends Record<string | number, any>
      ? MapLeafNodes<Obj[Prop], LeafType>
      : never;
};

export type NullableTokens = {
  [key: string]: string | number | NullableTokens | null;
};

export type Tokens = {
  [key: string]: string | number | Tokens;
};

export type ThemeVars<ThemeContract extends NullableTokens> = MapLeafNodes<
  ThemeContract,
  CSSVarFunction
>;

export type GlobalFontFaceRule = Omit<AtRule.FontFaceFallback, 'src'> &
  Required<Pick<AtRule.FontFaceFallback, 'src'>>;
export type FontFaceRule = Omit<GlobalFontFaceRule, 'fontFamily'>;

// https://github.com/vanilla-extract-css/vanilla-extract/blob/master/packages/css/src/types.ts

// csstype is yet to ship container property types as they are not in
// the output MDN spec files yet. Remove this once that's done.
// https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Container_Queries
interface ContainerProperties {
  container?: string;
  containerType?: 'size' | 'inline-size' | (string & {});
  containerName?: string;
}

type CSSTypeProperties = Properties<number | (string & {})> &
  ContainerProperties;

export type CSSProperties = {
  [Property in keyof CSSTypeProperties]:
  | CSSTypeProperties[Property]
  | CSSVarFunction
};

export interface CSSKeyframes {
  [time: string]: CSSProperties;
}

interface MediaQueries<StyleType> {
  [string: `@media${string}`]: StyleType;
}

interface FeatureQueries<StyleType> {
  [string: `@supports${string}`]: StyleType;
}

interface ContainerQueries<StyleType> {
  [string: `@container${string}`]: StyleType;
}

export type WithQueries<StyleType> = MediaQueries<
  StyleType &
  FeatureQueries<StyleType & ContainerQueries<StyleType>> &
  ContainerQueries<StyleType & FeatureQueries<StyleType>>
> &
  FeatureQueries<
    StyleType &
    MediaQueries<StyleType & ContainerQueries<StyleType>> &
    ContainerQueries<StyleType & MediaQueries<StyleType>>
  > &
  ContainerQueries<
    StyleType &
    MediaQueries<StyleType & FeatureQueries<StyleType>> &
    FeatureQueries<StyleType & MediaQueries<StyleType>>
  >;

interface WithDirectDescendants<StyleType> {
  [string: `> ${string}`]: StyleType;
}

interface WithNestedSelectors<StyleType> {
  [string: `& ${string}`]: StyleType;
}

type WithPseudoSelectors<StyleType> = {
  // Todo: fix this properly
  [key in SimplePseudos | `${SimplePseudos},${SimplePseudos}` | `${SimplePseudos}, ${SimplePseudos}`]?: StyleType;
}

type WithAdvancedPseudoSelectors<StyleType> = {
  [key in `${AdvancedPseudos}${string}`]?: StyleType;
}

export interface StyleRule extends
  CSSProperties,
  WithQueries<StyleRule>,
  WithPseudoSelectors<StyleRule>,
  WithAdvancedPseudoSelectors<StyleRule>,
  WithDirectDescendants<StyleRule>,
  WithNestedSelectors<StyleRule> {}

export type GlobalStyleRule = StyleRule;
