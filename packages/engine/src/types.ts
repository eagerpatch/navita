import type { CSSKeyframes, FontFaceRule } from "@navita/types";

export interface StyleBlock {
  type: 'rule' | 'static';
  selector: string;
  property: string;
  value: string;
  pseudo: string;
  media: string;
  support: string;
  id: string | number;
}

export interface KeyframesBlock {
  type: 'keyframes';
  rule: CSSKeyframes;
  id: string;
}

export interface FontFaceBlock {
  type: 'fontFace';
  rule: FontFaceRule[];
  id: string;
}

export interface IdentifierGenerator<Data> {
  next(data: Data): string | number;
}
