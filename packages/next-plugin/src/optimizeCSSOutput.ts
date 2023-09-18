import type { CSSOutput, UsedIdCache } from "@navita/webpack-plugin";
import type { Chunk } from "webpack";

const merge = (...merge: UsedIdCache[]) => {
  const result: UsedIdCache = {};

  for (const usedIds of merge) {
    for (const key in usedIds) {
      result[key] = [...(result[key] || []), ...(usedIds[key] || [])];
    }
  }

  for (const key in result) {
    result[key] = [...new Set(result[key])];
  }

  return result;
};

const intersect = (...intersect: UsedIdCache[]) => {
  const result: UsedIdCache = {};

  for (const usedIds of intersect) {
    for (const key in usedIds) {
      result[key] = result[key] ? result[key].filter(id => usedIds[key].includes(id)) : usedIds[key];
    }
  }

  return result;
}

// structuredClone would be better, but since Next.js version 13 is at node 16.14.0,
// we can't use it.
const copy = (source: UsedIdCache): UsedIdCache => JSON.parse(JSON.stringify(source));

const removeParentFromCurrent = (usedIds: UsedIdCache, parentUsedIds: UsedIdCache) => {
  for (const key in parentUsedIds) {
    if (usedIds[key] && parentUsedIds[key]) {
      usedIds[key] = usedIds[key].filter(id => !parentUsedIds[key].includes(id));
    }
  }
};

export function optimizeCSSOutput(output: CSSOutput) {
  const nameToChunk = Object.fromEntries(
    Array.from(output.keys()).filter((x) => x.name).map((x) => [x.name, x])
  );

  const getAllParentUsedIds = (chunk: Chunk) => {
    const { name: route } = chunk;

    if (!route) {
      // If we don't have a name, it's a dynamic chunk.
      const value = output.get(chunk);

      if (value.parents.length === 0) {
        return [];
      }

      return [
        intersect(
          ...value.parents.map((parent) => merge(
              ...getAllParentUsedIds(parent),
              output.get(parent).usedIds
            )
          )
        )
      ];
    }

    if (route.startsWith('pages/')) {
      const routes = [
        'pages/_document',
        'pages/_app',
        route,
      ];

      const currentRouteIndex = routes.indexOf(route);

      return routes
        .filter((_, index) => currentRouteIndex > index)
        .map((x) => output.get(nameToChunk[x]))
        .filter(Boolean).map((x) => copy(x.usedIds));
    }

    const parts = route.split('/');
    const parents: UsedIdCache[] = [];

    let currentPart = '';

    for (const part of parts) {
      currentPart = [currentPart, part].filter(Boolean).join('/');
      const possibleParent = `${currentPart}/layout`;

      if (route === possibleParent) {
        continue;
      }

      const parentChunk = nameToChunk[possibleParent];

      if (output.has(parentChunk)) {
        parents.push(copy(output.get(parentChunk).usedIds));
      }
    }

    return parents;
  };

  const newOutput: CSSOutput = new Map();

  for (const chunk of output.keys()) {
    const currentUsedIds = copy(output.get(chunk).usedIds);

    for (const parent of getAllParentUsedIds(chunk)) {
      removeParentFromCurrent(currentUsedIds, parent);
    }

    newOutput.set(chunk, {
      ...output.get(chunk),
      usedIds: currentUsedIds,
    });
  }

  return newOutput;
}
