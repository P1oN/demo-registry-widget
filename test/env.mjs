import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function parseDotEnv(content) {
  const out = {};
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const idx = line.indexOf('=');
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

function loadDotEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const content = readFileSync(filePath, 'utf8');
  return parseDotEnv(content);
}

const dotEnv = loadDotEnvFile(resolve('.env'));

function pick(key, fallback) {
  const value = process.env[key] ?? dotEnv[key];
  if (typeof value === 'string' && value.length > 0) return value;
  return fallback;
}

export const scriptEnv = {
  npmCacheDir: pick('NPM_CACHE_DIR', '.npm-cache'),
  npmLogsDir: pick('NPM_LOGS_DIR', '.npm-cache/_logs'),
};
