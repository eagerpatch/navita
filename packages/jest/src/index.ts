import { setAdapter } from "@navita/adapter";
import { createEngine } from "@navita/engine";


beforeEach(async () => {
  const engine = await createEngine();

  setAdapter({
    generateIdentifier: (value) => engine.generateIdentifier(value),
    addCss: (css) => engine.addStyle(css),
    addStaticCss: (selector, css) => engine.addStatic(selector, css),
    addFontFace: (fontFace) => engine.addFontFace(fontFace),
    addKeyframe: (keyframe) => engine.addKeyframes(keyframe),
  });
});
