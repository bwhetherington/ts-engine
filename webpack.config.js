const path = require('path');

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
    modules: ['node_modules', path.join(__dirname, 'src')],
    extensions: ['.ts', '.tsx', '.js', '.json'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'build', 'client'),
  }
};
