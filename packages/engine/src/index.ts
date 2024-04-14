import path from "path";
import hash from '@emotion/hash';
import type { CSSKeyframes, FontFaceRule, StyleRule } from "@navita/types";
import { Cache } from "./cache";
import { isObject } from "./helpers/isObject";
import { splitStyleBlocks } from "./helpers/splitStyleBlocks";
import { IDGenerator } from "./identifiers/IDGenerator";
import { AlphaIDGenerator } from "./identifiers/alphaIDGenerator";
import { PropertyValueIDGenerator } from "./identifiers/propertyValueIDGenerator";
import { printFontFaces } from "./printers/printFontFaces";
import { printKeyFrames } from "./printers/printKeyFrames";
import type { SourceMapReference } from "./printers/printSourceMap";
import { printSourceMap } from "./printers/printSourceMap";
import { printStyleBlocks } from "./printers/printStyleBlocks";
import { sortAtRules } from "./printers/sortAtRules";
import { processKeyframes } from "./processKeyframes";
import { processStyles } from "./processStyles";
import type { FontFaceBlock, KeyframesBlock, StyleBlock } from "./types";
import { ClassList } from "./wrappers/classList";
import { Static } from "./wrappers/static";

export { ClassList } from "./wrappers/classList";
export { Static } from "./wrappers/static";

type CacheKeys = keyof Engine["caches"];
export type UsedIdCache = { [key in CacheKeys]?: (string | number)[] };
type FilePath = string;

interface Identifier {
  value: string;
  id: string;
}

export type Options = {
  context?: string;
  enableSourceMaps?: boolean;
  enableDebugIdentifiers?: boolean;
};

const defaultOptions: Options = {
  enableSourceMaps: false,
  enableDebugIdentifiers: false,
};

export class Engine {
  private readonly caches = {
    rule: new Cache<StyleBlock>(new PropertyValueIDGenerator()),
    static: new Cache<StyleBlock>(new IDGenerator()),
    keyframes: new Cache<KeyframesBlock>(new AlphaIDGenerator()),
    fontFace: new Cache<FontFaceBlock>(new AlphaIDGenerator()),
    identifiers: new Cache<Identifier>(new AlphaIDGenerator()),
  };
  private readonly usedIds: Record<FilePath, UsedIdCache> = {};
  private filePath: string | undefined;
  private identifierCount = 0;
  private readonly options: Options = {};
  private sourceMapReferences: SourceMapReference = {};

  constructor(options: Options = {}) {
    this.options = {
      ...defaultOptions,
      ...Object.keys(options).reduce((acc, key) => {
        if (options[key] !== undefined) {
          acc[key] = options[key];
        }

        return acc;
      }, {} as Options),
    };
  }

  addStatic(selector: string, styles: StyleRule) {
    this.addUsedIds(
      "static",
      processStyles({
        type: "static",
        cache: this.caches.static
      })({
        styles,
        selector,
      }).map((style) => style.id)
    );

    return new Static();
  }

  addStyle(styles: StyleRule) {
    const rules = processStyles({
      type: "rule",
      cache: this.caches.rule
    })({ styles });

    const ids = rules.map((rule) => rule.id);

    this.addUsedIds("rule", ids);

    return new ClassList(ids.join(" "));
  }

  addFontFace(fontFace: FontFaceRule | FontFaceRule[]) {
    const { id } = this.caches.fontFace.getOrStore({
      type: "fontFace",
      rule: Array.isArray(fontFace) ? fontFace : [fontFace],
    });

    this.addUsedIds("fontFace", [id]);

    return id;
  }

  addKeyframes(keyframes: CSSKeyframes) {
    const { id } = this.caches.keyframes.getOrStore({
      type: "keyframes",
      rule: processKeyframes(keyframes),
    });

    this.addUsedIds("keyframes", [id]);

    return id;
  }

  addSourceMapReference({
    filePath,
    identifier,
    classList,
    line,
    column,
    index
  }: {
    index: number;
    identifier: string;
    classList: ClassList;
    filePath: string;
    line: number;
    column: number;
  }) {
    if (!this.options.enableSourceMaps) {
      return false;
    }

    const { name } = path.parse(filePath);
    const extraClass = this.options.enableDebugIdentifiers ? `${name}_${identifier}` : '';
    const selector = '.' + classList
      .toString()
      .split(' ')
      .concat(extraClass)
      .filter(Boolean)
      .join('.');

    const newFilePath = path.relative(this.options.context || process.cwd(), filePath);

    if (index === 0 || !this.sourceMapReferences[newFilePath]) {
      this.sourceMapReferences[newFilePath] = [];
    }

    this.sourceMapReferences[newFilePath][index] = {
      selector,
      line,
      column,
    };

    return extraClass;
  }

  private clearSourceMapReferences(filePath: string) {
    const newFilePath = path.relative(this.options.context || process.cwd(), filePath);
    this.sourceMapReferences[newFilePath] = [];
  }

  clearCache(filePath: string) {
    this.clearUsedIds(filePath);
    this.clearSourceMapReferences(filePath);
  }

  generateIdentifier(value: unknown) {
    if (typeof value === 'undefined') {
      let identifier = hash((this.identifierCount++).toString(36));

      if (identifier.match(/^\d/)) {
        identifier = `_${identifier}`;
      }

      return identifier;
    }

    const newValue = JSON.stringify(value);

    const { id } = this.caches.identifiers.getOrStore({
      value: newValue
    });

    this.addUsedIds("identifiers", [id]);

    return `_${id}`;
  }

  renderCssToString(options?: {
    filePaths?: string[],
    usedIds?: UsedIdCache,
    opinionatedLayers?: boolean,
  }) {
    const { filePaths, usedIds, opinionatedLayers = false } = options || {};

    // We prioritize ids over filePaths. If neither are provided, we use all the used filePaths.
    const {
      keyframes: keyframesCache,
      fontFace: fontFaceCache,
      static: staticCache,
      rule: ruleCache
    } = usedIds ?? this.getCacheIds(filePaths ?? Object.keys(this.usedIds));

    const { atRules, lowPrioRules, rules } = splitStyleBlocks(this.caches.rule.items(ruleCache));

    const keyFrameCss = printKeyFrames(this.caches.keyframes.items(keyframesCache));
    const fontFaceCss = printFontFaces(this.caches.fontFace.items(fontFaceCache));
    const staticCss = printStyleBlocks(this.caches.static.items(staticCache));
    const atRulesCss = printStyleBlocks(sortAtRules(atRules));
    const lowPrioRulesCss = printStyleBlocks(lowPrioRules);
    const rulesCss = printStyleBlocks(rules);

    if (opinionatedLayers) {
      const result = (
        `${keyFrameCss}${fontFaceCss}` +
        (staticCss.length > 0 ? `@layer s{${staticCss}}` : '') +
        (lowPrioRulesCss.length > 0 ? `@layer lpr{${lowPrioRulesCss}}` : '') +
        (rulesCss.length > 0 ? `@layer r{${rulesCss}}` : '') +
        (atRulesCss.length > 0 ? `@layer at{${atRulesCss}}` : '')
      );

      if (result.length > 0) {
        // s - static
        // lpr - low priority rules
        // r - rules
        // at - at rules
        return `@layer s,lpr,r,at;${result}`;
      }

      return '';
    }

    const content = (
      keyFrameCss +
      fontFaceCss +
      staticCss +
      lowPrioRulesCss +
      rulesCss +
      atRulesCss
    );

    if (this.options.enableSourceMaps) {
      return printSourceMap(
        this.sourceMapReferences,
        content,
      );
    }

    return content;
  }

  serialize() {
    const { caches, usedIds, identifierCount, sourceMapReferences: sourceMapReferencesData } = this;

    const sourceMapReferences = this.options.enableSourceMaps ? sourceMapReferencesData : undefined;

    return JSON.stringify({
      caches,
      usedIds,
      identifierCount,
      sourceMapReferences,
    });
  }

  async deserialize(buffer: Buffer | string) {
    const data = JSON.parse(buffer.toString());

    function assign(target: Engine, source: Engine) {
      for (const key in source) {
        if (isObject(target[key]) && isObject(source[key])) {
          assign(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }

      return target;
    }

    assign(this, data);
  }

  setFilePath(filePath: string | undefined) {
    this.filePath = filePath;
  }

  getUsedFilePaths() {
    return Object.keys(this.usedIds);
  }

  getItems(caches: UsedIdCache) {
    return Object.keys(caches).reduce((acc, key) => ({
      ...acc,
      [key]: this.caches[key as CacheKeys].items(caches[key as CacheKeys]),
    }), {} as {
      [K in CacheKeys]?: ReturnType<Engine['caches'][K]['items']>;
    });
  }

  clearUsedIds(filePath: string) {
    if (filePath === undefined) {
      return;
    }

    this.usedIds[filePath] = {};
  }

  private addUsedIds(
    cacheType: CacheKeys,
    identifiers: (string | number)[]
  ) {
    const { filePath } = this;

    if (filePath === undefined) {
      return;
    }

    if (this.usedIds[filePath] === undefined) {
      this.usedIds[filePath] = {};
    }

    if (this.usedIds[filePath][cacheType] === undefined) {
      this.usedIds[filePath][cacheType] = [];
    }

    this.usedIds[filePath][cacheType] = [
      ...new Set([
        ...this.usedIds[filePath][cacheType],
        ...identifiers,
      ]),
    ];
  }

  getCacheIds(filePaths: string[] = []) {
    return filePaths.reduce((acc, filePath) => ({
      ...acc,
      ...Object.keys(this.usedIds[filePath] || []).reduce((cache, key) => ({
        ...cache,
        [key]: [...(acc[key] || []), ...(this.usedIds[filePath][key] || [])],
      }), {})
    }), Object.keys(this.caches).reduce((acc, key) => ({
      ...acc,
      [key]: [],
    }), {}) as UsedIdCache);
  }
}
