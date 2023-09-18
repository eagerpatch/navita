import { defineDocumentType, makeSource } from "contentlayer/source-files";
import type { Root } from "hast";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import type { LineElement } from "rehype-pretty-code";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import { visit } from "unist-util-visit";
import { generateToc } from "./contentlayer/generateToc";
import { navitaCompile } from "./contentlayer/navitaCompile";
import { removeFirstHeading } from "./contentlayer/removeFirstHeading";

const orderRegex = /^((\d+)-)?(.*)$/;
const urlFromFlattenedPath = (filePath: string) => {
  return filePath
    .replace(/[A-Z]/g, (match, offset) => (offset > 0 ? '-' : '') + `${match.toLowerCase()}`)
    .toLowerCase()
    .split("/")
    .map((x) => x.replace(orderRegex, "$3"))
    .join("/");
};

const slugAsParams = (filePath: string) => urlFromFlattenedPath(filePath).split("/").slice(1).join("/").replace(/^overview\//, '');

export const Doc = defineDocumentType(() => ({
  name: 'Doc',
  filePathPattern: `documentation/**/*.md`,
  contentType: 'mdx',
  fields: {
    title: {
      type: 'string',
      required: true
    },
    description: {
      type: 'string',
      required: false
    },
    display: {
      type: 'boolean',
      required: false,
      default: true,
    }
  },
  computedFields: {
    slug: {
      type: 'string',
      resolve: (doc) => {
        const slug = '/' +
          urlFromFlattenedPath(doc._raw.flattenedPath)
            .replace(/^documentation\//, '')
            .replace(/^overview\//, '');

        if (slug === '/getting-started') {
          return '/';
        }

        return slug;
      }
    },
    originalSlugAsParams: {
      type: 'string',
      resolve: (doc) => slugAsParams(doc._raw.flattenedPath),
    },
    slugAsParams: {
      type: 'string',
      resolve: (doc) => {
        const asParams = slugAsParams(doc._raw.flattenedPath);

        if (asParams === 'getting-started') {
          return '';
        }

        return asParams;
      },
    },
    pathSegments: {
      type: 'json',
      resolve: (doc) => doc._raw.flattenedPath.split("/").slice(1).map((dirName, index) => {
        const [, , orderStr, pathName] = dirName.match(orderRegex) ?? [];

        return {
          order: orderStr ? parseInt(orderStr) : 0,
          pathName,
          index,
        };
      }),
    },
    path: {
      type: 'string',
      resolve: (doc) => urlFromFlattenedPath(doc._raw.flattenedPath).split("/").slice(1).join("/"),
    },
    toc: {
      type: 'json',
      resolve: generateToc,
    }
  },
}));

export const Example = defineDocumentType(() => ({
  name: 'Example',
  filePathPattern: `src/examples/**/*.md`,
  contentType: 'mdx',
}));

// Todo: added react as a dependency in the monorepo, try to find a solution for that
export default makeSource({
  documentTypes: [Doc, Example],
  contentDirPath: '.',
  contentDirInclude: ['documentation', 'src/examples'],
  mdx: {
    rehypePlugins: [
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
      navitaCompile,
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
    ]
  }
});
