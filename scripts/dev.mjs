import { spawn } from 'node:child_process';

const commands = [
  { name: 'build:watch', cmd: ['npm', 'run', 'build:watch'] },
  { name: 'playground', cmd: ['npm', 'run', 'playground'] },
];

const children = commands.map(({ name, cmd }) => {
  const child = spawn(cmd[0], cmd.slice(1), {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`${name} exited with code ${code}`);
      shutdown(code);
    }
  });

  return child;
});

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM');
  }
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
