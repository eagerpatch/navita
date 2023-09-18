import type { Adapter } from "@navita/adapter";
import { setAdapter as _setAdapter } from "@navita/adapter";
import { ClassList} from "@navita/engine";
import type { Static } from "@navita/engine";
import type { Engine } from "@navita/engine";
import type { GlobalStyleRule, StyleRule } from "@navita/types";

export function setAdapter({
  engine,
  collectResults,
}: {
  engine: Engine,
  collectResults?: Record<string, unknown>,
}) {
  _setAdapter({
    generateIdentifier: (value) => engine.generateIdentifier(value),
    addStaticCss: (selector, css) => engine.addStatic(selector, css),
    addCss: (css) => engine.addStyle(css),
    addKeyframe: (keyframe) => engine.addKeyframes(keyframe),
    addFontFace: (fontFace) => {
      const hasFontFamily = (Array.isArray(fontFace) ? fontFace : [fontFace]).some((fontFace) => 'fontFamily' in fontFace);

      if (hasFontFamily) {
        throw new Error('This function creates and returns a font-family name, so the "fontFamily" property should not be provided.');
      }

      return engine.addFontFace(fontFace);
    },
    collectResult({
      index,
      filePath,
      identifier,
      result: resultFactory,
      line,
      column,
    }) {
      if (index === 0) {
        if (collectResults) {
          collectResults[filePath] = [];
        }
        engine.clearUsedIds(filePath);
      }

      engine.setFilePath(filePath);
      let result = resultFactory();
      engine.setFilePath(undefined);

      if (result instanceof ClassList) {
        const extraClass = engine.addSourceMapReference({
          index,
          identifier,
          classList: result,
          filePath,
          line,
          column,
        });

        if (extraClass) {
          result = new ClassList([
            result.toString(),
            extraClass
          ].join(' ')) as typeof result;
        }
      }

      if (collectResults) {
        collectResults[filePath][index] = result;
      }

      return result;
    }
  } as Adapter & {
    addCss(css: StyleRule): ClassList,
    addStaticCss(selector: string, css: GlobalStyleRule): Static,
  });
}
