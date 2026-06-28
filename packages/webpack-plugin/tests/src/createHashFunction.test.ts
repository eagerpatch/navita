import { createHash as nodeCreateHash } from "node:crypto";
import type { Compilation } from "webpack";
import { createHashFunction } from "../../src/createHashFunction";

// A minimal stand-in for the bits of `Compilation` that `createHashFunction`
// reads: `compiler.webpack.util.createHash` and the output hash options.
const makeCompilation = (
  overrides: Partial<Compilation["outputOptions"]> = {},
) =>
  ({
    compiler: {
      webpack: {
        util: {
          createHash: (algorithm: string) => nodeCreateHash(algorithm),
        },
      },
    },
    outputOptions: {
      hashFunction: "sha256",
      hashDigest: "hex",
      hashDigestLength: 12,
      ...overrides,
    },
  }) as unknown as Compilation;

describe("createHashFunction", () => {
  it("returns a function that hashes its parts", () => {
    const hash = createHashFunction(makeCompilation());

    const result = hash("hello world");

    expect(typeof result).toBe("string");
    expect(result).toHaveLength(12);
  });

  it("respects hashDigestLength", () => {
    const hash = createHashFunction(makeCompilation({ hashDigestLength: 8 }));

    expect(hash("hello world")).toHaveLength(8);
  });

  it("hashes multiple parts together", () => {
    const hash = createHashFunction(makeCompilation());

    const combined = hash("a", "b");
    const concatenated = createHashFunction(makeCompilation())("ab");

    // Updating with ['a', 'b'] must equal updating with 'ab'.
    expect(combined).toBe(concatenated);
  });

  // Locks C11: a single crypto Hash instance cannot be reused after `.digest()`
  // has been called. Before the fix this threw "Digest already called" the
  // second time the returned function ran.
  it('can be called more than once (no "Digest already called")', () => {
    const hash = createHashFunction(makeCompilation());

    const first = hash("one");

    expect(() => hash("two")).not.toThrow();

    // Deterministic across calls for the same input.
    expect(hash("one")).toBe(first);
    // Different inputs still differ.
    expect(hash("two")).not.toBe(first);
  });
});
