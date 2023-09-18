export function merge(...classNames: (string | false | void | null | 0 | '')[]) {
  const input = classNames.filter(Boolean).join(' ').split(' ');
  const output: Record<string, string> = {};

  for (const className of input) {
    const [property] = className.split(/\d+$/);
    output[property] = className;
  }

  return Object.values(output).join(' ');
}
