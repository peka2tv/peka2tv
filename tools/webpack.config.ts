import webpack from 'webpack';
import path from 'path';
/* tslint:disable:no-var-requires */
const nodeExternals = require('webpack-node-externals');
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';

export interface IWebpackConfigOptions {
  entry: string;
  outputPath: string;
  outputFilename: string;
}

const WEBPACK_CONFIG = (options: IWebpackConfigOptions): webpack.Configuration => {
  const config: webpack.Configuration = {
    mode: 'production',
    target: 'node',

    entry: options.entry,
    output: {
      path: options.outputPath,
      filename: options.outputFilename,
    },

    resolve: {
      extensions: ['.ts', '.js'],
      plugins: [new TsconfigPathsPlugin()],
    },
    externals: [path.resolve(__dirname, '../node_modules'), nodeExternals()],

    optimization: {
      minimize: false,
    },

    module: {
      rules: [{ test: /\.ts$/, use: 'ts-loader', exclude: /node_modules/ }],
    },

    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify('production'),
        },
      }),
    ],
  };

  return config;
};

export default WEBPACK_CONFIG;
