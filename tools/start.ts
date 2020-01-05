import { run } from './utils';

const PACKAGES_FOLDER_NAME = 'packages';
const RUN_DIRECTORY = process.env.INIT_CWD || '';
const ARGS = process.argv.slice(2);

const projectName = RUN_DIRECTORY.slice(RUN_DIRECTORY.indexOf(PACKAGES_FOLDER_NAME) + PACKAGES_FOLDER_NAME.length + 1);
const serviceEntryPoint = RUN_DIRECTORY + '/service.ts';
const argumentsString = ARGS.slice(1).join(' ');

if (!projectName) {
  console.log('This script can be runned only from `packages/*` directory.');
  process.exit(0);
}

run(`yarn ts-node -r tsconfig-paths/register ${serviceEntryPoint} ${argumentsString}`);
