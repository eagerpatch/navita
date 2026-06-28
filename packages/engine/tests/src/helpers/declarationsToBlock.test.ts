/* eslint-disable @typescript-eslint/ban-ts-comment */
import { declarationsToBlock } from '../../../src/helpers/declarationsToBlock';

describe('declarationsToBlock', () => {
  it('should return a string', () => {
    expect(declarationsToBlock({})).toEqual('');
  });

  it('should create a string from key value pairs', () => {
    expect(declarationsToBlock({ a: 1, b: 2 })).toEqual('a:1;b:2');
  });

  it('should ignore non string and non number values', () => {
    expect(
      declarationsToBlock({
        a: 1,
        b: '2',
        // @ts-expect-error
        c: true,
        d: undefined,
        e: null,
        // @ts-expect-error
        f: {},
        // @ts-expect-error
        g: [],
      }),
    ).toEqual('a:1;b:2');
  });
});
