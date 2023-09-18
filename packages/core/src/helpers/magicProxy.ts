export function createMagicProxy() {
  // Todo: at some point, the magic proxy should notify the user
  //  that they are using a browser API in a node environment
  return new Proxy({}, {
    get: () => createMagicProxy(),
  });
}
