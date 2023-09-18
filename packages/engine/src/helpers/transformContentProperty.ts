// https://github.com/vanilla-extract-css/vanilla-extract/blob/40d7e72c041989a4dc847dc66b94a4c680b5536e/packages/css/src/transformCss.ts#L277
export function transformContentProperty(value: string) {
  return value &&
  (value.includes('"') ||
    value.includes("'") ||
    /^([A-Za-z\-]+\([^]*|[^]*-quote|inherit|initial|none|normal|revert|unset)(\s|$)/.test(
      value,
    ))
    ? value
    : `"${value}"`;
}
