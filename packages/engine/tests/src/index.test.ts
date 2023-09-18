import { ClassList, Engine, Static } from '../../src';

describe('Engine', () => {
  describe('scoped css', () => {
    it('should render scoped css', () => {
      const engine = new Engine();
      engine.setFilePath('file1.ts');
      engine.addStyle({ color: 'red' });
      engine.addStyle({ background: 'red' });
      engine.setFilePath('file2.ts');
      engine.addStyle({ color: 'green' });
      expect(engine.renderCssToString({ filePaths: ['file2.ts'] })).toEqual(
        `.a2{color:green}`,
      );
      expect(engine.renderCssToString({ filePaths: ['file1.ts'] })).toEqual(
        `.a1{color:red}.b1{background:red}`,
      );
    });
  });

  describe('serialize/deserialize', () => {
    it('should serialize/deserialize', () => {
      const engine = new Engine();
      engine.setFilePath('file1.ts');
      engine.addStyle({ color: 'red' });
      engine.addStyle({ background: 'red' });
      expect(engine.renderCssToString({ filePaths: ['file1.ts'] })).toEqual(
        `.a1{color:red}.b1{background:red}`,
      );

      const buffer = engine.serialize();

      const newEngine = new Engine();
      newEngine.deserialize(buffer);
      newEngine.setFilePath('file1.ts');
      newEngine.addStyle({ color: 'green' });

      expect(newEngine.renderCssToString({ filePaths: ['file1.ts'] })).toEqual(
        `.a1{color:red}.b1{background:red}.a2{color:green}`,
      );
    });
  });

  it('should return classNames for styles', () => {
    const engine = new Engine();

    engine.setFilePath('file1.ts');

    const result = engine.addStyle({
      color: 'red',
      '@media (min-width: 500px)': {
        color: 'blue',
        '@supports (display: grid)': {
          color: 'green',
        },
      },
    });

    expect(result).toBeInstanceOf(ClassList);
    expect(result.toString()).toEqual('a1 b1 c1');
    expect(engine.renderCssToString()).toEqual(
      `.a1{color:red}@media (min-width: 500px){.b1{color:blue}@supports (display: grid){.c1{color:green}}}`,
    );
  });

  it('should return undefined for static styles', () => {
    const engine = new Engine();

    engine.setFilePath('file1.ts');

    const result = engine.addStatic('.foo', {
      background: 'royalblue',
      color: 'hotpink',
    });

    expect(result).toBeInstanceOf(Static);
    expect(engine.renderCssToString()).toEqual(
      `.foo{background:royalblue;color:hotpink;}`,
    );
  });

  it('should render a more full stylesheet', () => {
    const engine = new Engine();

    engine.setFilePath('file1.ts');

    engine.addStatic('html', {
      background: 'royalblue',
    });

    engine.addStatic('html, body', {
      margin: 0,
    });

    engine.addStyle({
      color: 'red',
      background: 'blue',
      '@media (min-width: 500px)': {
        color: 'blue',
        '@supports (display: grid)': {
          color: 'green',
        },
      },
    });

    engine.addStyle({
      color: 'yellow',
      background: 'blue',
    });

    engine.addStyle({
      color: 'red',
    });

    expect(engine.renderCssToString()).toMatchInlineSnapshot(
      `"html{background:royalblue;}html, body{margin:0;}.a1{color:red}.b1{background:blue}.a2{color:yellow}@media (min-width: 500px){.c1{color:blue}@supports (display: grid){.d1{color:green}}}"`,
    );
  });

  it('should only store same keyframes once', () => {
    const engine = new Engine();

    engine.setFilePath('file1.ts');

    // We run this a few times to make sure it's not stored multiple times
    expect(
      engine.addKeyframes({
        from: { color: 'red' },
        to: { color: 'blue' },
      }),
    ).toEqual('a');
    expect(
      engine.addKeyframes({
        from: { color: 'red' },
        to: { color: 'blue' },
      }),
    ).toEqual('a');
    expect(
      engine.addKeyframes({
        from: { color: 'red' },
        to: { color: 'blue' },
      }),
    ).toEqual('a');

    expect(engine.renderCssToString()).toEqual(
      '@keyframes a{from{color:red}to{color:blue}}',
    );
  });

  it('should only store same font-face once', () => {
    const engine = new Engine();

    engine.setFilePath('file1.ts');

    expect(
      engine.addFontFace({
        src: 'local("Gentium")',
      }),
    ).toEqual('a');

    expect(
      engine.addFontFace({
        src: 'local("Gentium")',
      }),
    ).toEqual('a');

    expect(engine.renderCssToString()).toMatchInlineSnapshot(
      `"@font-face{font-family:a;src:local("Gentium")}"`,
    );
  });

  it('should return the same font-family for an array', () => {
    const engine = new Engine();

    engine.setFilePath('file1.ts');

    expect(
      engine.addFontFace([
        {
          src: 'local("Gentium Bold")',
          fontWeight: 'bold',
        },
        {
          src: 'local("Gentium")',
          fontWeight: 'normal',
        },
      ]),
    ).toEqual('a');

    expect(engine.renderCssToString()).toMatchInlineSnapshot(
      `"@font-face{font-family:a;src:local("Gentium Bold");font-weight:bold}@font-face{font-family:a;src:local("Gentium");font-weight:normal}"`,
    );
  });

  describe('renderCssToString (opinionatedLayers)', () => {
    it('should handle opinionatedLayers', () => {
      const engine = new Engine();

      engine.setFilePath('file1.ts');

      engine.addStyle({
        color: 'red',
      });

      engine.addStatic('.foo', {
        background: 'royalblue',
      });

      engine.addStyle({
        '@supports (display: grid)': {
          color: 'green',
        },
      });

      expect(
        engine.renderCssToString({ opinionatedLayers: true }),
      ).toMatchInlineSnapshot(
        `"@layer static,rules,at;@layer static{.foo{background:royalblue;}}@layer rules{.a1{color:red}}@layer at{@supports (display: grid){.b1{color:green}}}"`,
      );
    });

    it('should only render the layers that are used', () => {
      const engine = new Engine();
      engine.setFilePath('file1.ts');

      engine.addFontFace({
        src: 'local("Gentium")',
      });

      engine.addKeyframes({
        from: { color: 'red' },
        to: { color: 'blue' },
      });

      expect(
        engine.renderCssToString({ opinionatedLayers: true }),
      ).toMatchInlineSnapshot(
        `"@layer static,rules,at;@keyframes a{from{color:red}to{color:blue}}@font-face{font-family:a;src:local("Gentium")}"`,
      );

      engine.addStatic('.foo', {
        background: 'royalblue',
      });

      expect(
        engine.renderCssToString({ opinionatedLayers: true }),
      ).toMatchInlineSnapshot(
        `"@layer static,rules,at;@keyframes a{from{color:red}to{color:blue}}@font-face{font-family:a;src:local("Gentium")}@layer static{.foo{background:royalblue;}}"`,
      );

      engine.addStyle({
        color: 'red',
      });

      expect(
        engine.renderCssToString({ opinionatedLayers: true }),
      ).toMatchInlineSnapshot(
        `"@layer static,rules,at;@keyframes a{from{color:red}to{color:blue}}@font-face{font-family:a;src:local("Gentium")}@layer static{.foo{background:royalblue;}}@layer rules{.a1{color:red}}"`,
      );

      engine.addStyle({
        '@supports (display: grid)': {
          color: 'green',
        },
      });

      expect(
        engine.renderCssToString({ opinionatedLayers: true }),
      ).toMatchInlineSnapshot(
        `"@layer static,rules,at;@keyframes a{from{color:red}to{color:blue}}@font-face{font-family:a;src:local("Gentium")}@layer static{.foo{background:royalblue;}}@layer rules{.a1{color:red}}@layer at{@supports (display: grid){.b1{color:green}}}"`,
      );
    });
  });

  it('keeps track of used identifiers', () => {
    const engine = new Engine();

    engine.setFilePath('file1.ts');

    // Adding the same a couple of times to check for uniqueness
    engine.addStyle({
      color: 'red',
    });
    engine.addStyle({
      color: 'red',
    });
    engine.addStyle({
      color: 'red',
    });

    engine.addStatic('.foo', {
      color: 'blue',
    });

    engine.addKeyframes({
      from: { color: 'red' },
      to: { color: 'blue' },
    });

    engine.addFontFace({
      src: 'local("Gentium")',
    });

    expect(engine['usedIds']).toEqual({
      'file1.ts': {
        fontFace: ['a'],
        keyframes: ['a'],
        rule: ['a1'],
        static: [1],
      },
    });
  });

  it('unsets usedIds on clearUsedIds', () => {
    const engine = new Engine();
    engine.setFilePath('file1.ts');
    engine.addStyle({
      color: 'red',
    });

    expect(engine['usedIds']).toEqual({
      'file1.ts': {
        rule: ['a1'],
      },
    });

    engine.clearUsedIds(undefined);

    expect(engine['usedIds']).toEqual({
      'file1.ts': {
        rule: ['a1'],
      },
    });

    engine.clearUsedIds('file1.ts');

    expect(engine['usedIds']).toEqual({
      'file1.ts': {},
    });
  });

  describe('identifiers', () => {
    it('generates incremental identifiers', () => {
      const engine = new Engine();
      expect(engine.generateIdentifier('color')).toEqual('_a');
      expect(engine.generateIdentifier('background')).toEqual('_b');
    });

    it('generates incremental identifiers for the same value', () => {
      const engine = new Engine();
      expect(engine.generateIdentifier('color')).toEqual('_a');
      expect(engine.generateIdentifier('color')).toEqual('_a');

      expect(engine.generateIdentifier('background')).toEqual('_b');
      expect(engine.generateIdentifier('background')).toEqual('_b');
    });
  });
});
