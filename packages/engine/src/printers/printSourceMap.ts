import { SourceMapGenerator } from "source-map";
type FilePath = string;
export type SourceMapReference = Record<FilePath, {
  selector: string;
  line: number;
  column: number;
}[]>;

export function printSourceMap(sourceMapReferences: SourceMapReference, content: string) {
  if (content.length === 0) {
    return content;
  }

  const entries = Object.entries(sourceMapReferences);

  if (entries.length === 0) {
    return content;
  }

  const sourceMap = new SourceMapGenerator({
    file: "navita.css"
  });

  const references = entries
    .flatMap(
      ([filePath, references]) => references.map(
        (reference) => ({ filePath, ...reference })
      )
    );

  for (const reference of references) {
    const { filePath, selector, line, column } = reference;
    const generatedColumn = content.length - 1;

    content += `${selector}{/* Only used for sourceMap */}`;

    sourceMap.addMapping({
      source: filePath,
      original: { line, column },
      generated: { line: 1, column: generatedColumn },
    });
  }

  const sourceMapContent = Buffer.from(sourceMap.toString()).toString('base64');

  content += `\n/*# sourceMappingURL=data:application/json;base64,${sourceMapContent} */`;

  return content;
}
