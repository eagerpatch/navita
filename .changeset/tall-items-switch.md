---
'@navita/vite-plugin': major
---

Adding Remix-specific vite plugin.

Instead of allowing Vite to extract the CSS, we use a virtual file, and send HMR updates to that file instead. 

During the build, we extract the CSS and write it to a file.
