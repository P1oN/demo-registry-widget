import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { scriptEnv } from './env.mjs';

const stdout = execSync(
  `npm pack --dry-run --json --cache ${scriptEnv.npmCacheDir} --logs-dir ${scriptEnv.npmLogsDir}`,
  {
    encoding: 'utf8',
    env: {
      ...process.env,
      NPM_CONFIG_CACHE: resolve(scriptEnv.npmCacheDir),
    },
  },
);
const packed = JSON.parse(stdout);
const files = packed?.[0]?.files?.map((f) => f.path) || [];

assert.ok(files.includes('dist/full.d.ts'), 'dist/full.d.ts should be packed');
assert.ok(files.includes('dist/micro.d.ts'), 'dist/micro.d.ts should be packed');

console.log('pack smoke passed');
