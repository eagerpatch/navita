/**
 * Splits a CSS selector list on top-level commas, ignoring commas that live
 * inside parentheses (`:is(.a, .b)`, `:not(.x, .y)`), square brackets
 * (`[data-x=","]`) or quoted strings.
 *
 * A naive `selector.split(',')` mangles grouped selectors, which is why this
 * paren/bracket/quote-aware split exists.
 *
 * Each returned segment is trimmed; empty segments are dropped.
 */
export function splitSelectorList(selectorList: string): string[] {
  const segments: string[] = [];
  let current = "";
  let parenDepth = 0;
  let bracketDepth = 0;
  let quote: string | null = null;

  for (let i = 0; i < selectorList.length; i++) {
    const char = selectorList[i];

    if (quote) {
      current += char;
      if (char === quote && selectorList[i - 1] !== "\\") {
        quote = null;
      }
      continue;
    }

    switch (char) {
      case '"':
      case "'":
        quote = char;
        break;
      case "(":
        parenDepth++;
        break;
      case ")":
        if (parenDepth > 0) parenDepth--;
        break;
      case "[":
        bracketDepth++;
        break;
      case "]":
        if (bracketDepth > 0) bracketDepth--;
        break;
    }

    if (char === "," && parenDepth === 0 && bracketDepth === 0) {
      segments.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  segments.push(current);

  return segments.map((segment) => segment.trim()).filter(Boolean);
}
