import type { Root } from "hast";

export function removeFirstHeading() {
  return (tree: Root) => {
    if (tree.type === 'root') {
      const h1 = tree.children.find(
        (node) => node.type === 'element' && node.tagName === 'h1'
      );
      tree.children = tree.children.filter((node: unknown) => node !== h1);
    }
  }
}
