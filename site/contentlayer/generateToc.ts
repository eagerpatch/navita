import type { Root } from "hast";
import { toc } from "mdast-util-toc";
import { remark } from "remark";
import { visit } from "unist-util-visit";

// Unist, remark, hast, rehype or w/e has the worst types ever.
// Very difficult to work with.
// Someone, please fix this mess.

export interface Item {
  title?: string;
  url?: string;
  items?: Item[];
}

const textTypes = ["text", "emphasis", "strong", "inlineCode"];

function flattenNode(node: Paragraph) {
  const p: string[] = [];

  visit(node, (node) => {
    if (!textTypes.includes(node.type)) {
      return;
    }

    p.push((node as TextNode).value);
  });

  return p.join('');
}

interface BaseNode {
  children: Node[];
}

interface TextNode extends BaseNode {
  type: "text";
  value: string;
}

interface Paragraph extends BaseNode {
  type: "paragraph";
}

interface Link extends BaseNode {
  type: "link";
  url: string;
}

interface List extends BaseNode {
  type: "list";
}

interface ListItem extends BaseNode {
  type: "listItem";
}

type Node = TextNode | Paragraph | Link | List | ListItem;

function getItems(node: Node, current: Item = {}): Item {
  if (!node) {
    return current;
  }

  if (node.type === "paragraph") {
    visit(node, (item: Node) => {
      if (item.type === "link") {
        current.url = item.url;
        current.title = flattenNode(node);
      }

      if (item.type === "text") {
        current.title = flattenNode(node);
      }
    });

    return current;
  }

  if (node.type === "list") {
    current.items = node.children?.map((i) => getItems(i)) || [];
    return current;
  }

  if (node.type === "listItem") {
    const heading = getItems(node.children![0]);

    if (node.children && node.children.length > 1) {
      getItems(node.children[1], heading);
    }

    return heading;
  }

  return current;
}

export async function generateToc(doc: { body: { raw: string } }) {
  return remark()
    .use(() => (node: Root, VFile) => {
      const result = getItems(
        toc(node as unknown as Parameters<typeof toc>[0]).map as Node, {}
      );

      const { items } = result;
      let tocWithoutFirst = items;

      if (items && items.length === 1) {
        // Grab the first item's children
        tocWithoutFirst = items[0].items;
      }

      VFile.data.toc = tocWithoutFirst;
    })
    .process(doc.body.raw)
    .then((x) => x.data.toc);
}
