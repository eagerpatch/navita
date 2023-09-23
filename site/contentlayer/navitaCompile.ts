import { dirname } from "path";
import path from "path";
import { fileURLToPath } from "url";
import { createRenderer } from "@navita/core/createRenderer";
import { importMap } from "@navita/css";
import type { Element, Root, Text } from "hast";
import prettier from "prettier";
import { visit } from "unist-util-visit";

export function navitaCompile() {
  return async (tree: Root, vFile: { data: Record<string, any> }) => {
    const { rawDocumentData: { flattenedPath } } = vFile.data as { rawDocumentData: { flattenedPath: string } };
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const files: Record<string, string> = {};
    const nodes: {
      node: Element;
      parent: Element;
      filename: string;
      source: string;
    }[] = [];

    const renderer = createRenderer({
      importMap,
      resolver: async (filepath, request) => {
        const virtualFile = request.replace(/^\.\//, '');

        if (virtualFile in files) {
          return path.resolve(currentDir, virtualFile);
        }

        return '';
      },
      readFile: async (filepath) => {
        const basename = path.basename(filepath);

        if (basename in files) {
          return files[basename];
        }

        return '';
      }
    });

    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName === 'code' && node.data && 'meta' in node.data) {
        const meta = node.data.meta as string;

        if (!meta.includes('compile')) {
          return;
        }

        let filename;
        const result = meta.match(/filename=(['"]?)([^'"\s]+)\1/);

        if (result) {
          filename = result[2].trim();
        }

        const child = node.children.find((child): child is Text => child.type === 'text');

        if (!child) {
          return;
        }

        const source = child.value.trim();

        if (!filename) {
          const fileNameRegex = /\/\/\s*(\S+\.(?:ts|js|tsx|jsx))/;

          const result = source.match(fileNameRegex);

          if (result) {
            filename = result[1].trim();

            // remove the filename comment with regex
            child.value = source.replace(fileNameRegex, '').trim();
          }
        }

        if (!filename) {
          filename = `example-${index}.js`;
        }

        // Grab source code from children
        files[filename] = source;

        nodes.push({
          node,
          parent: parent as Element,
          filename,
          source,
        });
      }
    });

    for (const node of nodes) {
      const { parent, filename, source } = node;
      const fakedFilePath = `${currentDir}/${flattenedPath}/${filename}`;

      const { result } = await renderer.transformAndProcess({
        content: source,
        filePath: fakedFilePath,
      });

      const [formattedCss, formattedResult] = await Promise.all([prettier.format(
        renderer.engine.renderCssToString({
          filePaths: [fakedFilePath]
        }), {
          parser: 'css',
          singleQuote: true,
        }), prettier.format(result, {
        parser: 'babel-ts',
        singleQuote: true,
        printWidth: 60,
      })]);

      // Replace parent in tree's children with a new node
      const index = tree.children.findIndex((child) => child === parent);

      tree.children[index] = {
        type: 'element',
        tagName: 'CompiledCode',
        properties: {
          filename,
        },
        children: [
          // First is input
          parent,
          // Second is css
          {
            type: 'element',
            tagName: 'pre',
            properties: {},
            children: [
              {
                type: 'element',
                tagName: 'code',
                properties: {
                  className: ['language-css'],
                },
                children: [
                  {
                    type: 'text',
                    value: formattedCss.length ? formattedCss : '/* no css output */',
                  }
                ]
              }
            ]
          },
          // Third is the compiled result
          {
            type: 'element',
            tagName: 'pre',
            properties: {},
            children: [
              {
                type: 'element',
                tagName: 'code',
                properties: {
                  className: ['language-js'],
                },
                children: [
                  {
                    type: 'text',
                    value: formattedResult,
                  }
                ]
              }
            ],
          }
        ]
      }
    }
  }
}
