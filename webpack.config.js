const path = require('path');
const webpack = require('webpack');
const process = require('process');

module.exports = {
  entry: path.resolve(__dirname, 'src', 'client', 'index.ts'),
  context: __dirname,
  node: {
    __filename: true,
    __dirname: true,
  },
  devtool: 'inline-source-map',
  plugins: [
    new webpack.DefinePlugin({
      __PRODUCTION__: JSON.stringify(process.env.NODE_ENV === 'PRODUCTION'),
    })
  ],
  module: {
    rules: [
      {
        test: /\.html$/,
        exclude: /node_modules/,
        use: {
          loader: 'html-loader',
        },
      },
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: path.resolve(
              __dirname,
              'config',
              'client',
              'tsconfig.json'
            ),
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.worker\.js/,
        use: 'worker-loader'
      }
    ],
  },
  resolve: {
    modules: [path.join(__dirname, 'src'), 'node_modules'],
    extensions: ['.ts', '.tsx', '.js', '.json'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'build', 'client'),
  }
};
