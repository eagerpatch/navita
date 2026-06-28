import { defineConfig } from 'tsdown';
import { navitaTypesPreset } from '../../scripts/tsdown/navitaPreset';

export default defineConfig(navitaTypesPreset('src/index.ts'));
