import { defineConfig } from "tsdown";
import { navitaPreset } from "../../scripts/tsdown/navitaPreset";

export default defineConfig(
  navitaPreset({
    dtsEntry: ["src/createRenderer.ts", "src/evaluateAndProcess.ts"],
  }),
);
