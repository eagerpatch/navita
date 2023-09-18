import type { CSSOutput, UsedIdCache } from "@navita/webpack-plugin";
import type { Chunk } from "webpack";
import { optimizeCSSOutput } from "../src/optimizeCSSOutput";

describe('optimizeCss', () => {
  let css: CSSOutput;

  beforeEach(() => {
    css = new Map();
  });

  const add = (id: number, name: string, usedIds: UsedIdCache, parents?: Chunk[]) => {
    const chunk = {
      id,
      name
    } as Chunk;

    const value = {
      usedIds: { ...usedIds },
      parents: [...(parents || [])],
      modules: [],
      filePaths: []
    };

    css.set(chunk, value);

    return [chunk, value] as const;
  }

  describe('app-router', () => {
    it('should optimize the css for next.js app-router', () => {
      const [chunk1] = add(1, 'app/layout', { rule: ['a'], static: [1, 2] });
      const [chunk2] = add(2, 'app/page', { rule: ['a', 'b', 'd'], static: [1, 2, 3] });
      const [chunk3] = add(3, 'app/(start)/layout', { rule: ['a', 'b'] });
      const [chunk4] = add(4, 'app/(start)/page', { rule: ['a', 'b', 'c'] });

      const newOutput = optimizeCSSOutput(css);

      expect(newOutput.get(chunk1)?.usedIds.rule).toEqual(['a']);
      expect(newOutput.get(chunk2)?.usedIds.rule).toEqual(['b', 'd']);
      expect(newOutput.get(chunk1)?.usedIds.static).toEqual([1, 2]);
      expect(newOutput.get(chunk2)?.usedIds.static).toEqual([3]);
      expect(newOutput.get(chunk3)?.usedIds.rule).toEqual(['b']);
      expect(newOutput.get(chunk4)?.usedIds.rule).toEqual(['c']);
    });

    it('should also work with dynamic chunks', () => {
      add(1, 'app/layout', { rule: ['a'] });
      add(2, 'app/(start)/layout', { rule: ['a', 'b'] });
      const [chunk3] = add(2, 'app/(start)/page', { rule: ['a', 'b', 'c'] });
      const [chunk4] = add(3, undefined, { rule: ['a', 'b', 'c', 'd'] }, [chunk3]);

      const newOutput = optimizeCSSOutput(css);

      expect(newOutput.get(chunk3)?.usedIds.rule).toEqual(['c']);
      expect(newOutput.get(chunk4)?.usedIds.rule).toEqual(['d']);
    });
  })

  describe('page-router', () => {
    it('should optimize the css for pages-router', () => {
      const [chunk1] = add(1, 'pages/_document', { rule: ['a'] });
      const [chunk2] = add(2, 'pages/_app', { rule: ['a', 'b'] });
      const [chunk3] = add(3, 'pages/index', { rule: ['a', 'b', 'c'] });

      const newOutput = optimizeCSSOutput(css);

      expect(newOutput.get(chunk1)?.usedIds.rule).toEqual(['a']);
      expect(newOutput.get(chunk2)?.usedIds.rule).toEqual(['b']);
      expect(newOutput.get(chunk3)?.usedIds.rule).toEqual(['c']);
    });

    it('should optimize for dynamic chunks', () => {
      add(1, 'pages/_document', { rule: ['a'] });
      add(2, 'pages/_app', { rule: ['a', 'b'] });
      const [chunk3] = add(3, 'pages/index', { rule: ['a', 'b', 'c'] });
      const [chunk4] = add(3, undefined, { rule: ['a', 'b', 'c', 'd'] }, [chunk3]);

      const newOutput = optimizeCSSOutput(css);

      expect(newOutput.get(chunk4)?.usedIds.rule).toEqual(['d']);
    });

    it('should optimize for dynamic chunks with multiple parents', () => {
      add(1, 'pages/_document', { rule: ['a'] });
      add(2, 'pages/_app', { rule: ['a', 'b'] });

      const [chunk3] = add(3, 'pages/index', { rule: ['in one parent', 'removed'] });
      const [chunk4] = add(4, 'pages/other', { rule: ['removed'] });
      const [chunk5] = add(5, undefined, { rule: ['in one parent', 'removed', 'dynamic'] }, [chunk3, chunk4]);

      const newOutput = optimizeCSSOutput(css);

      expect(newOutput.get(chunk5)?.usedIds.rule).toEqual(['in one parent', 'dynamic']);
    });

  });
});
