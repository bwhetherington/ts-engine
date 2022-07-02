const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: path.resolve(__dirname, 'src', 'client', 'index.ts'),
  context: __dirname,
  node: {
    __filename: true,
    __dirname: true,
  },
  devtool: 'inline-source-map',
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
      }
    ],
  },
  resolve: {
    modules: ['node_modules'],
    alias: {
      '@': path.resolve(path.join(__dirname, 'src')),
    },
    extensions: ['.ts', '.tsx', '.js', '.json'],
    fallback: {
      buffer: require.resolve('buffer/'),
    }
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'build', 'client'),
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
  ]
};
