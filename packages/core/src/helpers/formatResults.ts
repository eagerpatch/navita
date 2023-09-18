import type { ClassList } from "@navita/engine";
import { Static } from "@navita/engine";

export function formatResults(results: (ClassList | Static | unknown)[] = []) {
  const result = results.map((item) => {
    if (item instanceof Static) {
      return '';
    }

    return JSON.stringify(item);
  });

  return `const $$evaluatedValues = [${result.join(',')}];`;
}
