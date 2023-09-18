import { sortDocs } from "@/utils/sortDocs";
import type { Doc } from 'contentlayer/generated';

interface PathSegment {
  pathName: string;
  order: number;
}

interface BetterDoc extends Doc {
  pathSegments: PathSegment[];
}

export interface DocTree {
  id: string;
  level: number;
  title: string;
  slug: string;
  slugAsParams?: string;
  doc?: BetterDoc;
  children: DocTree[];
}

export const buildDocumentationTree = (docs: BetterDoc[]): DocTree[] => {
  const sorted = docs.sort(sortDocs);
  const rootNodes: DocTree[] = [];
  const pathMap = new Map<string, DocTree[]>([['', rootNodes]]);

  for (const doc of sorted) {
    const parent = doc.pathSegments.slice(0, -1).map((x) => x.pathName).join('/');

    // Since we're sorted, we know that the parent has already been added
    const currentParent = pathMap.get(parent)!;

    if (!pathMap.has(doc.path)) {
      pathMap.set(doc.path, []);
    }

    currentParent.push({
      id: doc._id,
      level: doc.pathSegments.length - 1,
      title: doc.title,
      slug: doc.slug,
      slugAsParams: doc.originalSlugAsParams,
      children: pathMap.get(doc.originalSlugAsParams)!,
    });
  }

  return rootNodes;
};
