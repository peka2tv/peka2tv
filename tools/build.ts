import { IWebpackConfigOptions } from './webpack.config';
import path from 'path';
import fs from 'fs';
import { run } from './utils';
import { argv } from 'yargs';

const PACKAGES_FOLDER_NAME = 'packages';
const PROJECT_DIRECTORY = process.env.INIT_CWD || '';
const WEBPACK_CONFIG = 'tools/webpack.config.ts';
const DIST_FOLDER = 'deploy/dist';

const projectName = PROJECT_DIRECTORY.slice(
  PROJECT_DIRECTORY.indexOf(PACKAGES_FOLDER_NAME) + PACKAGES_FOLDER_NAME.length + 1,
);

if (!projectName) {
  console.log('This script can be runned only from `packages/*` directory.');
  process.exit(0);
}

createJsBundle();
createBinary();
cleanup();

function createJsBundle(): void {
  console.log(`(~) (${projectName}) creating js bundle`);

  const webpackConfigOptions: IWebpackConfigOptions = {
    entry: path.resolve(PROJECT_DIRECTORY, 'service.ts'),
    outputPath: path.resolve(PROJECT_DIRECTORY, DIST_FOLDER),
    outputFilename: `${projectName}.js`,
  };

  const webpackEnvOptions = Object.keys(webpackConfigOptions)
    .map(option => `--env.${option}="${webpackConfigOptions[option]}"`)
    .join(' ');

  run(`yarn webpack --config ${WEBPACK_CONFIG} ${webpackEnvOptions}`);

  console.log(`(+) (${projectName}) creating js bundle done`);
}

function createBinary(): void {
  console.log(`(~) (${projectName}) creating binary`);

  const platform = getBinaryTargetPlatform();

  const target = `node10-${platform}-x64`;
  const jsBundleFile = getJsBundlePath();
  const binaryFile = path.resolve(PROJECT_DIRECTORY, DIST_FOLDER, projectName);

  run(`yarn pkg --target=${target} ${jsBundleFile} -o ${binaryFile}`);

  console.log(`(+) (${projectName}) creating binary done`);
}

function cleanup(): void {
  const jsBundleFile = getJsBundlePath();

  fs.unlinkSync(jsBundleFile);
}

function getJsBundlePath() {
  return path.resolve(PROJECT_DIRECTORY, DIST_FOLDER, `${projectName}.js`);
}

function getBinaryTargetPlatform(): string {
  if (argv.binaryTarget) {
    return argv.binaryTarget as string;
  }

  return 'linux';
}
