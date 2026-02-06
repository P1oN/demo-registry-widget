import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/full.ts"],
    format: ["esm"],
    minify: true,
    sourcemap: false,
    outDir: "dist",
    clean: true,
  },
  {
    entry: ["src/micro.ts"],
    format: ["esm"],
    minify: true,
    sourcemap: false,
    outDir: "dist",
    clean: false,
  },
]);
