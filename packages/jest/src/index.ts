import { setAdapter } from "@navita/adapter";
import { Engine } from "@navita/engine";

beforeEach(() => {
  const engine = new Engine();

  setAdapter({
    generateIdentifier: (value) => engine.generateIdentifier(value),
    addCss: (css) => engine.addStyle(css).toString(),
    addStaticCss: (selector, css) => engine.addStatic(selector, css),
    addFontFace: (fontFace) => engine.addFontFace(fontFace),
    addKeyframe: (keyframe) => engine.addKeyframes(keyframe),
  });
});
