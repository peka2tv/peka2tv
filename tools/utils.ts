import { execSync } from 'child_process';

export function run(command: string) {
  execSync(command, { cwd: process.cwd(), stdio: 'inherit' });
}
