import path from "path";
import hash from "@emotion/hash";
import type { CSSKeyframes, FontFaceRule, StyleRule } from "@navita/types";
import { createCache } from "./cache";
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
import type { createUsedIdCache } from "./usedIdCache";
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
  cacheDirectory?: string;
  context?: string;
  enableSourceMaps?: boolean;
  enableDebugIdentifiers?: boolean;
};

const defaultOptions: Options = {
  enableSourceMaps: false,
  enableDebugIdentifiers: false,
};

const createOptions = (options: Options) => ({
  ...defaultOptions,
  ...Object.keys(options).reduce((acc, key) => {
    if (options[key] !== undefined) {
      acc[key] = options[key];
    }

    return acc;
  }, {} as Options),
});

export function createEngine(options: Options = {}) {
  return new Engine(options, false);
}

export async function createAsyncEngine(options: Options = {}) {
  return new Engine(options, true);
}

export class Engine {
  private options: Options = {};
  private caches;
  private readonly usedIds: Record<FilePath, UsedIdCache> = {};
  private filePath: string | undefined;
  private identifierCount = 0;
  private sourceMapReferences: SourceMapReference = {};

  private newUsedIds: Awaited<ReturnType<typeof createUsedIdCache>>;

  constructor(options: Options = {}, private isAsync = false) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return Promise.resolve().then(async () => {
      this.options = createOptions(options);
      const { cacheDirectory } = this.options;

      this.caches = {
        rule: createCache<StyleBlock>('rule', PropertyValueIDGenerator, cacheDirectory),
        static: createCache<StyleBlock>('static', IDGenerator, cacheDirectory),
        keyframes: createCache<KeyframesBlock>('keyframes', AlphaIDGenerator, cacheDirectory),
        fontFace: createCache<FontFaceBlock>('fontFace', AlphaIDGenerator, cacheDirectory),
        identifiers: createCache<Identifier>('identifiers', AlphaIDGenerator, cacheDirectory),
      };

      // this.newUsedIds = await createUsedIdCache(this, cacheDirectory);

      return this;
    });
  }

  setFilePath(filePath: string | undefined) {
    this.filePath = filePath;
  }

  getFilePath() {
    return this.filePath;
  }

  async addStatic(selector: string, styles: StyleRule) {
    const rules = processStyles({
      styles,
      selector,
    });

    const ids = rules.map((rule) => rule.id);

    this.addUsedIds("static", ids);
    this.newUsedIds.add("static", ids);

    return new Static();
  }

  addStyle(styles: StyleRule) {
    const rules = processStyles({ styles });

    let test = 'hejsan';

    (async () => {
      const ids = await Promise.all(
        rules.map(async (rule) => this.caches.rule.getOrStore(rule.id))
      );

      console.log('ids', ids);

      this.addUsedIds("rule", ids);

      test = new ClassList(ids.join(" "));
    })();

    console.log(test);


    return test;

    /*
    if (this.isAsync) {
      return Promise.resolve().then(async () => {
        console.log('rules', rules);


        console.log('ids', ids);

        this.addUsedIds("rule", ids);

        return new ClassList(ids.join(" "));
      });

     */
  }

  async addFontFace(fontFace: FontFaceRule | FontFaceRule[]) {
    const { id } = await this.caches.fontFace.getOrStore({
      type: "fontFace",
      rule: Array.isArray(fontFace) ? fontFace : [fontFace],
    });

    this.addUsedIds("fontFace", [id]);

    return id;
  }

  async addKeyframes(keyframes: CSSKeyframes) {
    const { id } = await this.caches.keyframes.getOrStore({
      type: "keyframes",
      rule: processKeyframes(keyframes),
    });

    this.addUsedIds("keyframes", [id]);

    return id;
  }

  async generateIdentifier(value: unknown) {
    if (typeof value === 'undefined') {
      let identifier = hash((this.identifierCount++).toString(36));

      if (identifier.match(/^\d/)) {
        identifier = `_${identifier}`;
      }

      return identifier;
    }

    const newValue = JSON.stringify(value);

    const { id } = await this.caches.identifiers.getOrStore({
      value: newValue
    });

    this.addUsedIds("identifiers", [id]);

    return `_${id}`;
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
    } = usedIds ?? this.getUsedCacheIds(filePaths ?? Object.keys(this.usedIds));

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

  getUsedCacheIds(filePaths: string[] = []) {
    console.log(this.usedIds);

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
