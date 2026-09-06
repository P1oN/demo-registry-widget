import { watch } from 'node:fs';
import { spawnSync } from 'node:child_process';

function buildStyles() {
  const result = spawnSync('node', ['scripts/build-styles.mjs'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    console.error('styles:build failed');
  }
}

buildStyles();

const watcher = watch('src/default-styles.css', { persistent: true }, () => {
  buildStyles();
});

console.log('Watching src/default-styles.css for changes...');

process.on('SIGINT', () => {
  watcher.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  watcher.close();
  process.exit(0);
});
