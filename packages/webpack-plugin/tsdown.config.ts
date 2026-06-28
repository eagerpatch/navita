import { defineConfig } from 'tsdown';
import { navitaPreset } from '../../scripts/tsdown/navitaPreset';

export default defineConfig(
  navitaPreset({
    dtsEntry: ['src/index.ts', 'src/loader.ts', 'src/hmr/css.ts'],
  }),
);
