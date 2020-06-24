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
    modules: [path.join(__dirname, "src"), "node_modules"],
    extensions: [".ts", ".tsx", ".js", ".json"],
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "build", "client"),
  },
};
