import type { CSSKeyframes, CSSProperties } from "@navita/types";
import { isObject } from "./helpers/isObject";
import { transformContentProperty } from "./helpers/transformContentProperty";

const transformValuePropertyMap = {
  content: transformContentProperty,
};

export function processKeyframes(keyframes: CSSKeyframes | CSSProperties) {
  const newKeyframes: CSSKeyframes = {};

  for (const [key, value] of Object.entries(keyframes)) {
    if (isObject(value)) {
      newKeyframes[key] = processKeyframes(value);
      continue;
    }

    let newValue = value;

    if (transformValuePropertyMap[key]) {
      newValue = transformValuePropertyMap[key](newValue);
    }

    newKeyframes[key] = newValue;
  }

  return newKeyframes;
}
