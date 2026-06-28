import type { StyleRule } from "@navita/types";
import type { Cache } from "./cache";
import { generateCombinedAtRules } from "./helpers/generateCombinedAtRules";
import { hyphenateProperty } from "./helpers/hyphenateProperty";
import { isContainerQuery } from "./helpers/isContainerQuery";
import { isMediaQuery } from "./helpers/isMediaQuery";
import { isNestedSelector } from "./helpers/isNestedSelector";
import { isObject } from "./helpers/isObject";
import { isSupportsQuery } from "./helpers/isSupportsQuery";
import { normalizeCSSVarsProperty } from "./helpers/normalizeCSSVarsProperty";
import { normalizeCSSVarsValue } from "./helpers/normalizeCSSVarsValue";
import { normalizeNestedProperty } from "./helpers/normalizeNestedProperty";
import { pixelifyProperties } from "./helpers/pixelifyProperties";
import { splitSelectorList } from "./helpers/splitSelectorList";
import { transformContentProperty } from "./helpers/transformContentProperty";
import type { StyleBlock } from "./types";

const transformValuePropertyMap = {
  content: transformContentProperty,
};

export function processStyles({
  cache,
  type,
}: {
  cache: Cache<StyleBlock>;
  type: StyleBlock["type"];
}) {
  return function process({
    styles,
    pseudo = "",
    media = "",
    support = "",
    container = "",
    selector = "",
  }: {
    styles: StyleRule;
    pseudo?: string;
    media?: string;
    support?: string;
    container?: string;
    selector?: string;
  }) {
    const result = [];

    for (const [property, value] of Object.entries(styles)) {
      if (isObject(value)) {
        if (isMediaQuery(property)) {
          const combinedMedia = generateCombinedAtRules(
            media,
            property.slice(6).trim(),
          );

          result.push(
            ...process({
              styles: value,
              pseudo,
              media: combinedMedia,
              support,
              container,
              selector,
            }),
          );

          continue;
        }

        if (isSupportsQuery(property)) {
          const combinedSupport = generateCombinedAtRules(
            support,
            property.slice(9).trim(),
          );

          result.push(
            ...process({
              styles: value,
              pseudo,
              media,
              support: combinedSupport,
              container,
              selector,
            }),
          );

          continue;
        }

        if (isContainerQuery(property)) {
          const combinedContainer = generateCombinedAtRules(
            container,
            property.slice(10).trim(),
          );

          result.push(
            ...process({
              styles: value,
              pseudo,
              media,
              support,
              container: combinedContainer,
              selector,
            }),
          );

          continue;
        }

        if (isNestedSelector(property)) {
          // Split the selector list in a paren/bracket/quote-aware way so that
          // grouped selectors like `&:is(.a, .b)` or `[data-x=","]` are not
          // mangled by a naive comma split.
          const copies = splitSelectorList(property);

          // A leading whitespace combinator (descendant nesting, e.g.
          // " .child") is significant but gets trimmed away by the split.
          // Re-attach it to the first segment only — leading whitespace on
          // later segments is cosmetic spacing after a comma.
          const hasLeadingDescendant = /^\s/.test(property);

          for (let i = 0; i < copies.length; i++) {
            const copy =
              i === 0 && hasLeadingDescendant ? ` ${copies[i]}` : copies[i];

            result.push(
              ...process({
                styles: value,
                pseudo: pseudo + normalizeNestedProperty(copy),
                media,
                support,
                container,
                selector,
              }),
            );
          }

          continue;
        }

        console.warn("Unknown property", property);

        continue;
      }

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
      result.push(
        cache.getOrStore({
          type,
          selector,
          property: newProperty,
          value: newValue,
          pseudo,
          media,
          support,
          container,
        }),
      );
    }

    return result as StyleBlock[];
  };
}
