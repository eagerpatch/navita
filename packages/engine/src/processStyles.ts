import type { StyleRule } from "@navita/types";
import type { Cache } from "./cache";
import { generateCombinedAtRules } from "./helpers/generateCombinedAtRules";
import { hyphenateProperty } from "./helpers/hypenateProperty";
import { isMediaQuery } from "./helpers/isMediaQuery";
import { isNestedSelector } from "./helpers/isNestedSelector";
import { isObject } from "./helpers/isObject";
import { isSupportsQuery } from "./helpers/isSupportsQuery";
import { normalizeCSSVarsProperty } from "./helpers/normalizeCSSVarsProperty";
import { normalizeNestedProperty } from "./helpers/normalizeNestedProperty";
import { pixelifyProperties } from "./helpers/pixelifyProperties";
import { transformContentProperty } from "./helpers/transformContentProperty";
import type { StyleBlock } from "./types";
import { normalizeCSSVarsValue } from "./helpers/normalizeCSSVarsValue";

const transformValuePropertyMap = {
  content: transformContentProperty,
};

export function processStyles({
  cache,
  type
}: {
  cache: Cache<StyleBlock>;
  type: StyleBlock["type"];
}) {
  return function process({
    styles,
    pseudo = "",
    media = "",
    support = "",
    selector = ""
  }: {
    styles: StyleRule;
    pseudo?: string;
    media?: string;
    support?: string;
    selector?: string;
  }) {
    const result = [];

    for (const [property, value] of Object.entries(styles)) {
      if (isObject(value)) {
        if (isMediaQuery(property)) {
          const combinedMedia = generateCombinedAtRules(
            media,
            property.slice(6).trim()
          );

          result.push(
            ...process({
              styles: value,
              pseudo,
              media: combinedMedia,
              support,
              selector
            })
          );
        } else if (isSupportsQuery(property)) {
          const combinedSupport = generateCombinedAtRules(
            support,
            property.slice(9).trim()
          );

          result.push(
            ...process({
              styles: value,
              pseudo,
              media,
              support: combinedSupport,
              selector
            })
          );
        } else if (isNestedSelector(property)) {
          // This is only allowed in simple pseudos currently.
          const copies = property.split(',').map((p) => p.trim());

          for (const copy of copies) {
            result.push(
              ...process({
                styles: value,
                pseudo: pseudo + normalizeNestedProperty(copy),
                media,
                support,
                selector
              })
            );
          }
        } else {
          console.warn("Unknown property", property);
        }
      } else {
        let newProperty = normalizeCSSVarsProperty(property);
        let newValue = value;

        if (typeof value === "string") {
          newValue = value.trim().replace(/;[\n\s]*$/, "");
          newValue = normalizeCSSVarsValue(newValue);
        }

        if (typeof value === "number") {
          newValue = pixelifyProperties(newProperty, value);
        }

        if (transformValuePropertyMap[newProperty]) {
          newValue = transformValuePropertyMap[newProperty](value);
        }

        newProperty = hyphenateProperty(newProperty);

        // Remove trailing semicolon and new lines with regex
        result.push(cache.getOrStore({
          type,
          selector,
          property: newProperty,
          value: newValue,
          pseudo,
          media,
          support
        }));
      }
    }

    return result as StyleBlock[];
  };
}
