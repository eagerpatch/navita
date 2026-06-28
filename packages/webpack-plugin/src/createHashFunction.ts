import type { Buffer } from "node:buffer";
import type { Compilation } from "webpack";

export function createHashFunction(compilation: Compilation) {
  const {
    webpack: {
      util: { createHash },
    },
  } = compilation.compiler;
  const {
    outputOptions: { hashFunction, hashDigest, hashDigestLength },
  } = compilation;

  return (...parts: (string | Buffer)[]) => {
    // Create a fresh hash per call: a crypto Hash instance cannot be reused
    // after `.digest()` has been called ("Digest already called").
    const hash = createHash(hashFunction);

    for (const part of parts) {
      hash.update(part);
    }

    return hash.digest(hashDigest).toString().substring(0, hashDigestLength);
  };
}
