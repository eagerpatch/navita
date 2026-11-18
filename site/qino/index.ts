import { initQino } from "@qino/cms";

export default initQino({
  contentFolder: "content",
  mediaFolder: "public",
  cli: {
    check: {
      // Links to other docs are rewritten to page URLs, not served from `public`
      localAssetReferences: { exclude: ["/documentation/**"] },
    },
  },
});
