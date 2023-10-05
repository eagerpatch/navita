import { Cache } from "../../src/cache";
import { IDGenerator } from "../../src/identifiers/IDGenerator";
import { processStyles as processStylesUnderTest } from "../../src/processStyles";
import type { StyleBlock } from "../../src/types";

describe('processStyles', () => {
  const createProcessStyles = ({ type }: Omit<Parameters<typeof processStylesUnderTest>[number], 'cache'>) =>
    processStylesUnderTest({
      cache: new Cache<StyleBlock>(new IDGenerator()),
      type,
    });

  describe('static', () => {
    it('should handle static declarations with pseudo selectors', () => {
      const processStyles = createProcessStyles({
        type: "static",
      });

      const result = processStyles({
        selector: '.test:hover',
        styles: {
          color: "red",
        },
      });

      expect(result).toHaveLength(1);
      expect(result).toEqual([
        expect.objectContaining({
          id: 1,
          property: "color",
          value: "red",
          // The user is responsible for the first level selector
          selector: '.test:hover',
        }),
      ]);
    });

    it('should work with nested pseudos', () => {
      const processStyles = createProcessStyles({
        type: "static",
      });

      const result = processStyles({
        selector: '.test:selection',
        styles: {
          ':hover': {
            color: "red",
          },
        },
      });

      expect(result).toHaveLength(1);
      expect(result).toEqual([
        expect.objectContaining({
          id: 1,
          property: "color",
          value: "red",
          selector: '.test:selection',
          pseudo: ':hover',
        }),
      ]);
    });

    it('works with selectors that look like pseudos', () => {
      const processStyles = createProcessStyles({
        type: "static",
      });

      const result = processStyles({
        selector: ':root',
        styles: {
          color: "red",
        },
      });

      expect(result).toHaveLength(1);
      expect(result).toEqual([
        expect.objectContaining({
          id: 1,
          property: "color",
          value: "red",
          selector: ':root',
          pseudo: '',
        }),
      ]);
    });
  });

  it('should return an empty array for empty input', () => {
    const processStyles = createProcessStyles({
      type: "rule",
    });

    const result = processStyles({
      styles: {},
    });

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it(`does not continue without a valid declaration`, () => {
    const processStyles = createProcessStyles({
      type: "rule",
    });

    const result = processStyles({
      styles: {
        "@media (min-width: 400px)": {},
      }
    });

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should correctly identify declarations', () => {
    const processStyles = createProcessStyles({
      type: "rule",
    });

    const result = processStyles({
      styles: {
        color: "red",
      },
    });

    expect(result).toHaveLength(1);
    expect(result).toEqual([
      expect.objectContaining({
        id: 1,
        property: "color",
        value: "red",
        pseudo: '',
        selector: '',
        media: '',
        support: '',
      }),
    ]);
  });

  it('should correctly identify declarations with pseudo selectors', () => {
    const processStyles = createProcessStyles({
      type: "rule",
    });

    const result = processStyles({
      styles: {
        ":hover": {
          color: "red",
        },
      },
    });

    expect(result).toHaveLength(1);
    expect(result).toEqual([
      expect.objectContaining({
        id: 1,
        property: "color",
        value: "red",
        pseudo: ':hover',
        selector: '',
        media: '',
        support: '',
      }),
    ]);
  });

  it('should correctly identify declarations with media queries', () => {
    const processStyles = createProcessStyles({
      type: "rule",
    });

    const result = processStyles({
      styles: {
        "@media (min-width: 400px)": {
          color: "red",
        },
      },
    });

    expect(result).toHaveLength(1);
    expect(result).toEqual([
      expect.objectContaining({
        id: 1,
        property: "color",
        value: "red",
        pseudo: '',
        selector: '',
        media: '(min-width: 400px)',
        support: '',
      }),
    ]);
  });

  it('should concat media nested media queries', () => {
    const processStyles = createProcessStyles({
      type: "rule",
    });

    const result = processStyles({
      styles: {
        "@media (min-width: 400px)": {
          "@media (max-width: 600px)": {
            color: "red",
          },
        },
      },
    });

    expect(result).toHaveLength(1);
    expect(result).toEqual([
      expect.objectContaining({
        id: 1,
        property: "color",
        value: "red",
        pseudo: '',
        selector: '',
        media: '(min-width: 400px) and (max-width: 600px)',
        support: '',
      }),
    ]);
  });

  it('should correctly identify declarations with supports queries', () => {
    const processStyles = createProcessStyles({
      type: "rule",
    });

    const result = processStyles({
      styles: {
        "@supports (display: grid)": {
          color: "red",
        },
      },
    });

    expect(result).toHaveLength(1);
    expect(result).toEqual([
      expect.objectContaining({
        id: 1,
        property: "color",
        value: "red",
        pseudo: '',
        selector: '',
        media: '',
        support: '(display: grid)',
      }),
    ]);
  });

  it('should handle multiple declarations', () => {
    const processStyles = createProcessStyles({
      type: "rule",
    });

    const result = processStyles({
      styles: {
        color: "red",
        backgroundColor: "blue",
      },
    });

    expect(result).toHaveLength(2);
    expect(result).toEqual([
      expect.objectContaining({
        id: 1,
        property: "color",
        value: "red",
        pseudo: '',
        selector: '',
        media: '',
        support: '',
      }),
      expect.objectContaining({
        id: 2,
        property: "background-color",
        value: "blue",
        pseudo: '',
        selector: '',
        media: '',
        support: '',
      }),
    ]);
  });

  it('should handle static declarations', () => {
    const processStyles = createProcessStyles({
      type: "static",
    });

    const result = processStyles({
      selector: '.test',
      styles: {
        color: "red",
        backgroundColor: "blue",
      },
    });

    expect(result).toHaveLength(2);
    expect(result).toEqual([
      expect.objectContaining({
        id: 1,
        property: "color",
        value: "red",
        selector: '.test',
      }),
      expect.objectContaining({
        id: 2,
        property: "background-color",
        value: "blue",
        selector: '.test',
      }),
    ]);
  });

  it('should transform specific properties (content)', () => {
    const processStyles = createProcessStyles({
      type: "rule",
    });

    const result = processStyles({
      styles: {
        content: '',
      },
    });

    expect(result).toHaveLength(1);
    expect(result).toEqual([
      expect.objectContaining({
        id: 1,
        property: "content",
        value: "\"\"",
      }),
    ]);
  });

  it('should create copies of declarations when using comma separated nested selectors', () => {
    const processStyles = createProcessStyles({
      type: "rule",
    });

    const result = processStyles({
      styles: {
        "::after, ::before": {
          color: "red",
        },
      },
    });

    expect(result).toHaveLength(2);
    expect(result).toEqual([
      expect.objectContaining({
        id: 1,
        property: "color",
        value: "red",
        pseudo: '::after',
      }),
      expect.objectContaining({
        id: 2,
        property: "color",
        value: "red",
        pseudo: '::before',
      }),
    ]);
  });

  it('should correctly identify a nesting with media, support and pseudo', () => {
    const processStyles = createProcessStyles({
      type: "rule",
    });

    const result = processStyles({
      styles: {
        "@media (min-width: 400px)": {
          "@supports (display: grid)": {
            "::after, ::before": {
              color: "red",
            }
          }
        }
      }
    });

    expect(result).toHaveLength(2);
    expect(result).toEqual([
      expect.objectContaining({
        id: 1,
        property: "color",
        value: "red",
        pseudo: '::after',
        media: '(min-width: 400px)',
        support: '(display: grid)',
      }),
      expect.objectContaining({
        id: 2,
        property: "color",
        value: "red",
        pseudo: '::before',
        media: '(min-width: 400px)',
        support: '(display: grid)',
      }),
    ]);
  });

  it('works with other nested selectors', () => {
    const processStyles = createProcessStyles({
      type: "rule",
    });

    const result = processStyles({
      styles: {
        "> .cool": {
          color: "red",
        },
      },
    });

    expect(result).toHaveLength(1);
    expect(result).toEqual([
      expect.objectContaining({
        id: 1,
        property: "color",
        value: "red",
        pseudo: '> .cool',
      }),
    ]);
  });

  it('removes trailing semicolons', () => {
    const processStyles = createProcessStyles({
      type: "rule",
    });

    const result = processStyles({
      styles: {
        color: "red;",
      },
    });

    expect(result).toHaveLength(1);
    expect(result).toEqual([
      expect.objectContaining({
        id: 1,
        property: "color",
        value: "red",
        pseudo: '',
      }),
    ]);
  });

  it('warns on invalid properties', () => {
    const processStyles = createProcessStyles({
      type: "rule",
    });

    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);

    const result = processStyles({
      styles: {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        '#####': {
          color: "red",
        }
      },
    });

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith('Unknown property', '#####');

    warn.mockReset();
  });

  it('adds a var() wrapper to values that start with --', () => {
    const processStyles = createProcessStyles({
      type: "rule",
    });

    const result = processStyles({
      styles: {
        color: "--red",
      },
    });

    expect(result).toHaveLength(1);
    expect(result).toEqual([
      expect.objectContaining({
        id: 1,
        property: "color",
        value: "var(--red)",
        pseudo: '',
      }),
    ]);
  });

  it(`doesn't touch values that don't start with --`, () => {
    const processStyles = createProcessStyles({
      type: "rule",
    });

    const result = processStyles({
      styles: {
        color: "var(--red)",
      },
    });

    expect(result).toHaveLength(1);
    expect(result).toEqual([
      expect.objectContaining({
        id: 1,
        property: "color",
        value: "var(--red)",
        pseudo: '',
      }),
    ]);
  });

  it('"pixelates" values that are numbers', () => {
    const processStyles = createProcessStyles({
      type: "rule",
    });

    const result = processStyles({
      styles: {
        width: 10,
      }
    });

    expect(result).toHaveLength(1);
    expect(result).toEqual([
      expect.objectContaining({
        id: 1,
        property: "width",
        value: "10px",
        pseudo: '',
      }),
    ]);
  });
});
