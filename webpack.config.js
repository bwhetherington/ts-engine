const path = require("path");

module.exports = {
  entry: path.resolve(__dirname, "src", "client", "index.ts"),
  devtool: "inline-source-map",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: "ts-loader",
          options: {
            configFile: path.resolve(
              __dirname,
              "config",
              "client",
              "tsconfig.json"
            ),
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "build", "client"),
  },
};
