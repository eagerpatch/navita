import type { StyleBlock } from "../types";
import { getPropertyPriority } from "../helpers/getPropertyPriority";

export function printStyleBlocks(blocks: StyleBlock[]) {
  let stylesheet = '';
  let previousStyle: StyleBlock | undefined;

  for (const style of blocks) {
    if (
      style.type === 'static' &&
      previousStyle &&
      (
        (previousStyle.selector !== style.selector) ||
        (previousStyle.pseudo !== style.pseudo) ||
        (previousStyle.media !== style.media) ||
        (previousStyle.support !== style.support)
      )
    ) {
      stylesheet += '}';
    }

    // Close support queries:
    // 1. When the current style is not a support query, and the previous style was support query
    // 2. When the current style is a support query and the previous style was a support query with a different support query
    if (previousStyle && previousStyle.support && (!style.support || (style.support !== previousStyle.support))) {
      stylesheet += '}';
    }

    // Close media queries:
    // 1. When the current style is not a media query, and the previous style was media query
    // 2. When the current style is a media query and the previous style was a media query with a different media query
    if (previousStyle && previousStyle.media && (!style.media || (style.media !== previousStyle.media))) {
      stylesheet += '}';
    }

    // Only add media queries if the previous style was not the same media query
    if (style.media && (previousStyle?.media !== style.media)) {
      stylesheet += `@media ${style.media}{`;
    }

    // Only add support queries if the previous style was not the same support query
    if (style.support && (previousStyle?.support !== style.support)) {
      stylesheet += `@supports ${style.support}{`;
    }

    if (style.type === 'rule') {
      const className = `.${style.id}`.repeat(getPropertyPriority(style.property));
      stylesheet += `${className}${style.pseudo}{`;
    } else if (
      style.type === 'static' &&
      (
        (previousStyle?.selector !== style.selector) ||
        (previousStyle?.pseudo !== style.pseudo) ||
        (previousStyle?.media !== style.media) ||
        (previousStyle?.support !== style.support)
      )
    ) {
      // If static, we don't add pseudo selectors currently
      stylesheet += `${style.selector}${style.pseudo}{`;
    }

    stylesheet += `${style.property}:${style.value}`;

    if (style.type === 'static') {
      stylesheet += ';';
    }

    if (style.type === 'rule') {
      stylesheet += '}';
    }

    previousStyle = style;
  }

  if (previousStyle?.support) {
    stylesheet += '}';
  }

  if (previousStyle?.media) {
    stylesheet += '}';
  }

  if (previousStyle?.type === 'static') {
    stylesheet += '}';
  }

  return stylesheet;
}
