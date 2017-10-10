const webpack = require('webpack');
const { env } = require('process');
const isProd = env.NODE_ENV === 'production';
const isProfile = env.PROFILE == 'true';
const isNonNil = x => x != null;
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

let conf = {
  entry: './src/client/index.js',

  output: {
    filename: './build/bundle.js'
  },

  devtool: 'inline-source-map',

  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" }
    ]
  },

  plugins: [
    isProfile ? new BundleAnalyzerPlugin() : null,

    new webpack.EnvironmentPlugin(['NODE_ENV']),

    new webpack.optimize.CommonsChunkPlugin({
      name: 'deps',
      filename: './build/deps.js',
      minChunks( module ){
        let context = module.context || '';

        return context.indexOf('node_modules') >= 0;
      }
    }),

    isProd ? new webpack.optimize.UglifyJsPlugin() : null
  ].filter( isNonNil )
};

module.exports = conf;
