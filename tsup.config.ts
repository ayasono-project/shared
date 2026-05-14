import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "core/index": "src/core/index.ts",
    "discord/index": "src/discord/index.ts",
    "api/index": "src/api/index.ts",
  },
  outDir: "dist",
  format: ["esm"],
  dts: true,
  sourcemap: false,
  clean: true,
  platform: "node",
  target: "node24",
  splitting: false,
});
