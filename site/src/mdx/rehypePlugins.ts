import type { EvaluateOptions } from "@mdx-js/mdx";
import type { Root } from "hast";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import type { LineElement } from "rehype-pretty-code";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import { visit } from "unist-util-visit";
import { navitaCompile } from "@/mdx/navitaCompile";
import { removeFirstHeading } from "@/mdx/removeFirstHeading";
import { urlFromFlattenedPath } from "@/utils/urlFromFlattenedPath";

export const getRehypePlugins = (flattenedPath: string): EvaluateOptions['rehypePlugins'] => [
  rehypeSlug,
  removeFirstHeading,
  () => (tree: Root) => {
   visit(tree, 'element', (node) => {
     if (
       node.tagName === 'a' &&
       node.properties &&
       typeof node.properties.href === 'string'
     ) {
       const href = node.properties.href;

       const http = href.startsWith('http://') || href.startsWith('https://');

       if (http) {
         node.properties.target = '_blank';
         node.properties.rel = 'noopener noreferrer';
       } else {
         const [urlPart, hashPart] = href.split('#');

         node.properties.href = urlFromFlattenedPath(urlPart)
             .replace(/^\/documentation\//, '')
             .replace(/\/overview/, '')
             .replace(/\.md$/, '') +
           (hashPart ? `#${hashPart}` : '');
       }
     }
    });
  },
  [navitaCompile, { flattenedPath }],
  [
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    rehypePrettyCode,
    {
      keepBackground: false,
      theme: "github-dark",
      onVisitLine(node: LineElement) {
        // Prevent lines from collapsing in `display: grid` mode, and allow empty
        // lines to be copy/pasted
        if (node.children.length === 0) {
          node.children = [{ type: "text", value: " " }]
        }
      },
      onVisitHighlightedLine(node: LineElement) {
        node.properties.className!.push("line--highlighted");
      },
      onVisitHighlightedWord(node: LineElement) {
        node.properties.className = ["word--highlighted"];
      },
    },
  ],
  [
    rehypeAutolinkHeadings,
    {
      properties: {
        ariaLabel: "Link to section",
      },
    },
  ],
];
