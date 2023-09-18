import type { Buffer } from "buffer";
import type { Compilation } from "webpack";

export function createHashFunction(compilation: Compilation) {
  const { webpack: { util: { createHash } } } = compilation.compiler;
  const { outputOptions: { hashFunction, hashDigest, hashDigestLength } } = compilation;

  const hash = createHash(hashFunction);

  return (...parts: (string | Buffer)[]) => {
    for (const part of parts) {
      hash.update(part);
    }

    return hash.digest(hashDigest).toString().substring(0, hashDigestLength);
  }
}
