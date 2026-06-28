import { getPropertyPriority } from "../helpers/getPropertyPriority";
import type { StyleBlock } from "../types";

type AtRuleKind = "media" | "container" | "support";

interface OpenAtRule {
  kind: AtRuleKind;
  value: string;
}

const AT_RULE_PREFIX: Record<AtRuleKind, string> = {
  media: "@media ",
  container: "@container ",
  support: "@supports ",
};

// The desired at-rule wrapper nesting order, outermost first. Blocks that share
// an outer wrapper stay grouped under it; an inner wrapper is (re)opened
// whenever the outer wrappers above it differ from what is currently open.
function getDesiredAtRules(style: StyleBlock): OpenAtRule[] {
  const desired: OpenAtRule[] = [];

  if (style.media) desired.push({ kind: "media", value: style.media });
  if (style.container)
    desired.push({ kind: "container", value: style.container });
  if (style.support) desired.push({ kind: "support", value: style.support });

  return desired;
}

// "&" is the parent reference. When present in the composed selector it is
// substituted for the element selector (`.className` for rules, the user's
// selector for static blocks). Otherwise the selector is appended after the
// element selector (the common pseudo / combinator suffix case).
function composeSelector(elementSelector: string, pseudo: string): string {
  if (pseudo.includes("&")) {
    return pseudo.replace(/&/g, elementSelector);
  }

  return `${elementSelector}${pseudo}`;
}

export function printStyleBlocks(blocks: StyleBlock[]) {
  let stylesheet = "";
  // Stack of currently open at-rule wrappers, outermost first.
  const openAtRules: OpenAtRule[] = [];
  // Whether a static selector block (`selector{ ... `) is currently open.
  let staticOpen = false;
  let previousStyle: StyleBlock | undefined;

  for (const style of blocks) {
    const desired = getDesiredAtRules(style);

    // Find how many of the currently open wrappers can be kept: the longest
    // common prefix of (open wrappers) and (desired wrappers). Once an outer
    // wrapper differs every wrapper nested inside it must be reopened too,
    // which is exactly what closing past the common prefix achieves.
    let common = 0;
    while (
      common < openAtRules.length &&
      common < desired.length &&
      openAtRules[common].kind === desired[common].kind &&
      openAtRules[common].value === desired[common].value
    ) {
      common++;
    }

    const atRulesWillChange = openAtRules.length > common;

    const staticGroupChanged =
      !!previousStyle &&
      (previousStyle.selector !== style.selector ||
        previousStyle.pseudo !== style.pseudo ||
        previousStyle.media !== style.media ||
        previousStyle.support !== style.support ||
        previousStyle.container !== style.container);

    // A static block lives *inside* the at-rule wrappers, so close it before
    // touching the wrappers (or when its own selector/pseudo identity changes).
    if (staticOpen && (atRulesWillChange || staticGroupChanged)) {
      stylesheet += "}";
      staticOpen = false;
    }

    // Close every wrapper past the common prefix, innermost first.
    while (openAtRules.length > common) {
      openAtRules.pop();
      stylesheet += "}";
    }

    // Open the remaining desired wrappers, outermost first.
    for (let i = common; i < desired.length; i++) {
      const wrapper = desired[i];
      stylesheet += `${AT_RULE_PREFIX[wrapper.kind]}${wrapper.value}{`;
      openAtRules.push(wrapper);
    }

    if (style.type === "rule") {
      const className = `.${style.id}`.repeat(
        getPropertyPriority(style.property),
      );
      const selector = composeSelector(className, style.pseudo);
      stylesheet += `${selector}{${style.property}:${style.value}}`;
    } else {
      // static
      if (!staticOpen) {
        const selector = composeSelector(style.selector, style.pseudo);
        stylesheet += `${selector}{`;
        staticOpen = true;
      }

      stylesheet += `${style.property}:${style.value};`;
    }

    previousStyle = style;
  }

  if (staticOpen) {
    stylesheet += "}";
  }

  while (openAtRules.length > 0) {
    openAtRules.pop();
    stylesheet += "}";
  }

  return stylesheet;
}
