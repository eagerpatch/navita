# @navita/webpack-plugin

## 0.4.3

### Patch Changes

- @navita/core@1.0.1

## 0.4.2

### Patch Changes

- Updated dependencies [6d3783e]
- Updated dependencies [c03767b]
  - @navita/css@0.2.0
  - @navita/core@1.0.0

## 0.4.1

### Patch Changes

- @navita/core@0.2.1

## 0.4.0

### Minor Changes

- b0976b2: This enables more usage of the caches in the rendering engine. It allows external tooling to hook into the navita process to do analysis or extraction for other tools

### Patch Changes

- Updated dependencies [b0976b2]
  - @navita/core@0.2.0

## 0.3.0

### Minor Changes

- 7c50e30: Added functionality to disable the usage of webpacks cache via the plugins constructor. Added a custom cache solution for next.js that uses a single text file to store the cache between compilations.

## 0.2.0

### Minor Changes

- 9d3109a: Improve support for the next.js plugin. This ensures that we don't add bytes to the page manifest when it's not needed, and differentiates navita caches between builds.

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
- 1f09b35: fix request property on navita dependency

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
