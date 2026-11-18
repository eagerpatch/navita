export const urlFromFlattenedPath = (filePath: string) => {
  return filePath
    .replace(/[A-Z]/g, (match, offset) => (offset > 0 ? '-' : '') + `${match.toLowerCase()}`)
    .toLowerCase();
};
