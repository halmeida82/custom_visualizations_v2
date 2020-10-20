var path = require("path");

//const UglifyJSPlugin = require("uglifyjs-webpack-plugin");

var webpackConfig = {
  mode: "production",
  entry: {
    tvc_gauge: "./src/visualizations/gauge/gauge.ts",
  },
  output: {
    filename: "[name].js",
    path: path.join(__dirname, "dist"),
    library: "[name]",
    libraryTarget: "umd",
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  //plugins: [new UglifyJSPlugin()],
  module: {
    rules: [
      //{ test: /\.js$/, loader: "babel-loader" },
      { test: /\.ts$/, loader: "ts-loader" },
      { test: /\.css$/, loader: ["to-string-loader", "css-loader"] },
    ],
  },
  stats: {
    warningsFilter: /export.*gauge.*was not found/,
  },
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
  optimization: {
    minimize: false,
  },
};

module.exports = webpackConfig;
