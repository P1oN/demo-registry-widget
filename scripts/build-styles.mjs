import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const src = resolve('src/default-styles.css');
const dst = resolve('dist/default-styles.css');

mkdirSync(dirname(dst), { recursive: true });
copyFileSync(src, dst);
console.log('Copied styles to dist/default-styles.css');
