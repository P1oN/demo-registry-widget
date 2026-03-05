import { defineConfig } from "tsup";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function parseDotEnv(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  const lines = content.split(/\r?\n/);

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;

    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }

  return out;
}

function loadDotEnv(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  return parseDotEnv(readFileSync(path, "utf8"));
}

function pickEnv(
  dotEnv: Record<string, string>,
  key: string,
  fallback: string,
): string {
  const fromProcess = process.env[key];
  if (typeof fromProcess === "string" && fromProcess.length > 0) {
    return fromProcess;
  }
  const fromFile = dotEnv[key];
  if (typeof fromFile === "string" && fromFile.length > 0) return fromFile;
  return fallback;
}

function pickNumberEnv(
  dotEnv: Record<string, string>,
  key: string,
  fallback: number,
): number {
  const value = pickEnv(dotEnv, key, String(fallback));
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const dotEnv = loadDotEnv(resolve(".env"));

const define = {
  __DRW_CACHE_KEY_PREFIX__: JSON.stringify(
    pickEnv(dotEnv, "DEMO_REGISTRY_CACHE_KEY_PREFIX", "demo-registry"),
  ),
  __DRW_REGISTRY_PATH__: JSON.stringify(
    pickEnv(dotEnv, "DEMO_REGISTRY_PATH", "/registry.tsv"),
  ),
  __DRW_MAX_AGE_MS__: String(
    pickNumberEnv(dotEnv, "DEMO_REGISTRY_MAX_AGE_MS", 7 * 24 * 60 * 60 * 1000),
  ),
  __DRW_BUTTON_ID__: JSON.stringify(
    pickEnv(dotEnv, "DEMO_WIDGET_BUTTON_ID", "demosBtn"),
  ),
  __DRW_POPOVER_ID__: JSON.stringify(
    pickEnv(dotEnv, "DEMO_WIDGET_POPOVER_ID", "demosPopover"),
  ),
  __DRW_CONTENT_ID__: JSON.stringify(
    pickEnv(dotEnv, "DEMO_WIDGET_CONTENT_ID", "demosContent"),
  ),
  __DRW_LIMIT__: String(pickNumberEnv(dotEnv, "DEMO_WIDGET_LIMIT", 8)),
  __DRW_SORT__: JSON.stringify(pickEnv(dotEnv, "DEMO_WIDGET_SORT", "none")),
};

export default defineConfig([
  {
    entry: ["src/full.ts"],
    format: ["esm"],
    dts: true,
    minify: true,
    sourcemap: false,
    outDir: "dist",
    clean: true,
    define,
    outExtension: () => ({ js: ".min.js" }),
  },
  {
    entry: ["src/micro.ts"],
    format: ["esm"],
    dts: true,
    minify: true,
    sourcemap: false,
    outDir: "dist",
    clean: false,
    define,
    outExtension: () => ({ js: ".min.js" }),
  },
]);
