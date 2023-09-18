import findCacheDirectory from 'find-cache-dir';

export async function findAndCreateCacheDir() {
  return findCacheDirectory({ name: '.swc' });
}
