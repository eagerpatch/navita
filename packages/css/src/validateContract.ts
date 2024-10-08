import type { Contract } from "@navita/types";
import { diff } from 'deep-object-diff';
import { walkObject } from "./helpers/walkObject";

const normaliseObject = (obj: Contract) => walkObject(obj, () => '');

export function validateContract(contract: any, tokens: any) {
  const theDiff = diff(normaliseObject(contract), normaliseObject(tokens));
  const valid = Object.keys(theDiff).length === 0;

  return {
    valid,
    diffString: valid ? '' : renderDiff(contract, theDiff),
  };
}

function diffLine(value: string, nesting: number, type?: '+' | '-') {
  const whitespace = [...Array(nesting).keys()].map(() => '  ').join('');
  const line = `${type ? type : ' '}${whitespace}${value}`;

  if (process.env.NODE_ENV !== 'test') {
    if (type === '-') {
      return `\x1b[31m${line}\x1b[0m`; // Red for '-' type
    }

    if (type === '+') {
      return `\x1b[32m${line}\x1b[0m`; // Green for '+' type
    }
  }

  return line;
}

function renderDiff(orig: any, diff: any, nesting = 0): string {
  const lines = [];

  if (nesting === 0) {
    lines.push(diffLine('{', 0));
  }

  const innerNesting = nesting + 1;

  const keys = Object.keys(diff).sort();

  for (const key of keys) {
    const value = diff[key];

    if (!(key in orig)) {
      lines.push(diffLine(`${key}: ...,`, innerNesting, '+'));
    } else if (typeof value === 'object') {
      lines.push(diffLine(`${key}: {`, innerNesting));

      lines.push(renderDiff(orig[key], diff[key], innerNesting));

      lines.push(diffLine('}', innerNesting));
    } else {
      lines.push(diffLine(`${key}: ...,`, innerNesting, '-'));
    }
  }

  if (nesting === 0) {
    lines.push(diffLine('}', 0));
  }
  return lines.join('\n');
}
