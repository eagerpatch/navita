// Recognizes the valid CSS nesting forms that may appear as object keys:
// - pseudo-classes / pseudo-elements (":hover", "::before")
// - attribute selectors ("[disabled]")
// - child / sibling combinators (">", "+", "~")
// - the parent reference "&" anywhere ("&:hover", "&.foo", ".parent &")
// - descendant nesting via a leading whitespace combinator (" .child")
//
// Anything else (bare type/class/id selectors like "div" or garbage like
// "#####") is NOT treated as nesting and falls through to the
// "Unknown property" path in processStyles.
const leadingCombinatorRegex = /^[:[>&+~\s]/;

export function isNestedSelector(property: string): boolean {
  return leadingCombinatorRegex.test(property) || property.includes("&");
}
