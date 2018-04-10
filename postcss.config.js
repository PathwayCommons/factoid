const { env } = require('process');
const isProd = env.NODE_ENV === 'production';
const isNonNil = x => x != null;

let conf = {
  plugins: [
    require('postcss-import')(),
    require('postcss-url')({
      url: 'inline',
      encodeType: 'base64',
      maxSize: Number.MAX_SAFE_INTEGER
    }),
    require('postcss-cssnext')({
      browsers: require('./package.json').browserslist,
      warnForDuplicates: false
    }),
    isProd ? require('cssnano')({
      safe: true
    }) : null
  ].filter( isNonNil )
};

module.exports = conf;
