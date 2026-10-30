import { cache } from "react";
import { documentationTree } from "../../qino/trees/documentation";
import { urlFromFlattenedPath } from "@/utils/urlFromFlattenedPath";

// "overview/getting-started" → "/", "api/globalStyle" → "/api/global-style"
function getDocUrl(slug: string) {
  const path = urlFromFlattenedPath(slug).replace(/^overview\//, '');

  return path == 'getting-started' ? '/' : `/${path}`;
}

// Section anchors have children and aren't pages
export const getDocPages = cache(async () => {
  const nodes = await documentationTree.getFlatTree();

  return nodes
    .filter((node) => node.children.length == 0)
    .map((node) => ({
      slug: node.slug,
      title: node.title,
      url: getDocUrl(node.slug),
    }));
});

export const getNavigation = cache(async () => {
  const sections = await documentationTree.getTree();

  return sections.map((section) => ({
    title: section.title,
    children: section.children.map((node) => ({
      title: node.title,
      url: getDocUrl(node.slug),
    })),
  }));
});

export type Navigation = Awaited<ReturnType<typeof getNavigation>>;

export const getDoc = cache(async (url: string) => {
  const pages = await getDocPages();
  const index = pages.findIndex((page) => page.url == url);

  if (index == -1) {
    return null;
  }

  const { slug } = pages[index];
  const entry = await documentationTree.getEntry(slug);

  return {
    title: entry.title,
    description: entry.description ?? undefined,
    markdown: entry.markdown,
    flattenedPath: `documentation/${slug}`,
    pager: {
      prev: pages[index - 1],
      next: pages[index + 1],
    },
  };
});

export type Pager = NonNullable<Awaited<ReturnType<typeof getDoc>>>['pager'];
