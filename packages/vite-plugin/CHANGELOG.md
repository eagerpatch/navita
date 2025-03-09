# @navita/vite-plugin

## 2.0.3

### Patch Changes

- @navita/core@1.0.1

## 2.0.2

### Patch Changes

- cafa840: Use options to determine if chunk belongs in server or client build

## 2.0.1

### Patch Changes

- 1859baa: change from middleware to transform for compatability with Shopify Hydrogen

## 2.0.0

### Major Changes

- 2d1ad33: Adding Remix-specific vite plugin.

  Instead of allowing Vite to extract the CSS, we use a virtual file, and send HMR updates to that file instead.

  During the build, we extract the CSS and write it to a file.

## 1.0.1

### Patch Changes

- e8a1084: Force the vite-plugin to use one renderer

## 1.0.0

### Major Changes

- c03767b: fix proper remix support in the vite plugin

### Patch Changes

- Updated dependencies [6d3783e]
- Updated dependencies [c03767b]
  - @navita/css@0.2.0
  - @navita/core@1.0.0

## 0.1.5

### Patch Changes

- @navita/core@0.2.1

## 0.1.4

### Patch Changes

- Updated dependencies [b0976b2]
  - @navita/core@0.2.0

## 0.1.3

### Patch Changes

- @navita/core@0.1.3

## 0.1.2

### Patch Changes

- @navita/core@0.1.2

## 0.1.1

### Patch Changes

- @navita/core@0.1.1

## 0.1.0

### Minor Changes

- a09e673: better cache handling when navita is used

### Patch Changes

- Updated dependencies [a09e673]
  - @navita/core@0.1.0
  - @navita/css@0.1.0

## 0.0.13

### Patch Changes

- Updated dependencies [d52050b]
  - @navita/css@0.0.13
  - @navita/core@0.0.13

## 0.0.12

### Patch Changes

- 4dbddc0: fix build script so tree shaking actually works when consuming packages
- Updated dependencies [4dbddc0]
  - @navita/css@0.0.12
  - @navita/core@0.0.12

## 0.0.11

### Patch Changes

- 974766e: Prevent library from being bundled to facilitate better tree shaking
- Updated dependencies [974766e]
  - @navita/core@0.0.11
  - @navita/css@0.0.11

## 0.0.10

### Patch Changes

- b02165f: normalize creation of css vars
- Updated dependencies [b02165f]
  - @navita/core@0.0.10
  - @navita/css@0.0.10

## 0.0.9

### Patch Changes

- a52048a: Replacing SWC-pass with MagicString
- Updated dependencies [a52048a]
  - @navita/core@0.0.9
  - @navita/css@0.0.9

## 0.0.8

### Patch Changes

- 5d03858: add description and keywords to packages
- Updated dependencies [5d03858]
  - @navita/core@0.0.8
  - @navita/css@0.0.8

## 0.0.7

### Patch Changes

- 96e9cee: Initial public release
- Updated dependencies [96e9cee]
  - @navita/core@0.0.7
  - @navita/css@0.0.7
