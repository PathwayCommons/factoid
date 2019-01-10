const webpack = require('webpack');
const { env } = require('process');
const isProd = env.NODE_ENV === 'production';
const isProfile = env.PROFILE == 'true';
const isNonNil = x => x != null;
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const path = require('path');

const envVars = ['NODE_ENV', 'PC_URL', 'BASE_URL'];

// dependencies that we need to babelify ourselves
const unbabelifiedDependencies = [
  'p-cancelable'
];

let conf = {
  entry: {
    bundle: './src/client/index.js',
    polyfills: './src/client/polyfills.js'
  },

  output: {
    filename: './build/[name].js'
  },

  devtool: 'inline-source-map',

  module: {
    rules: [
      {
        loader: 'babel-loader',
        test: /\.js$/,
        include: [
          path.resolve(__dirname, 'src'),
        ].concat( unbabelifiedDependencies.map( pkg => path.resolve(__dirname, 'node_modules', pkg) ) ),
        options: {
          cacheDirectory: true
        }
      }
    ]
  },

  plugins: [
    isProfile ? new BundleAnalyzerPlugin() : null,

    new webpack.EnvironmentPlugin(envVars),

    new webpack.optimize.CommonsChunkPlugin({
      name: 'deps',
      filename: './build/deps.js',
      minChunks( module ){
        let context = module.context || '';

        return context.indexOf('node_modules') >= 0 && !module.chunks.some(chunk => chunk.name === 'polyfills');
      }
    }),

    new webpack.optimize.CommonsChunkPlugin({
      name: 'webpackjsonp',
      chunks: ['deps'],
      minChunks: function(){
        return false;
      }
    }),

    isProd ? new webpack.optimize.UglifyJsPlugin() : null
  ].filter( isNonNil )
};

module.exports = conf;
