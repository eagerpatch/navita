export function startsWithRSCDirective(content: string) {
  return /^(['"])use client\1;?/.test(content);
}
