import { defineConfig } from "tsdown";
import { navitaPreset } from "../../scripts/tsdown/navitaPreset";

export default defineConfig(
  navitaPreset({ format: ["cjs"], dtsEntry: "src/index.ts" }),
);
