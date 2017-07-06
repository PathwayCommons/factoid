var process = require('process');
var objectAssign = require('object-assign');
var gulp = require('gulp');
var browserify = require('browserify');
var babelify = require('babelify');
var watchify = require('watchify');
var envify = require('envify');
var nodemon = require('nodemon');
var del = require('del');
var paths = require('vinyl-paths');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var clean = function(){ return paths( del ); };
var notifier = require('node-notifier');
var $ = require('gulp-load-plugins')();
var runSequence = require('run-sequence');
var pkg = require('./package.json');
var deps = pkg.bundledDependencies || [];
var path = require('path');
var through = require('through');
var streamNop = through;
var fs = require('fs');
var nopTarget = function( next ){ next(); }

process.on('SIGINT', function() {
  $.util.log($.util.colors.red('Successfully closed gulp process ' + process.pid));
  process.exit(1);
});

var emptyTask = function( next ){
  next();
};

var logError = function( err ){
  notifier.notify({ title: pkg.name, message: 'Error: ' + err.message });
  $.util.log( $.util.colors.red(err) );
};

var handleErr = function( err ){
  logError( err );

  if( this.emit ){
    this.emit('end');
  }
};

var getBrowserified = function( opts ){
  opts = opts || {};

  opts = objectAssign({
    debug: opts.debug,
    cache: {},
    packageCache: {},
    fullPaths: false,
    bundleExternal: true,
    entries: [ 'src/client' ]
  }, opts );

  return browserify( opts ).on( 'log', $.util.log );
};

var transform = function( b ){
  return ( b
    .transform( babelify.configure( JSON.parse( fs.readFileSync('.babelrc') ) ) )
    .transform( envify )
    .external( deps )
  ) ;
};

var bundle = function( b ){
  return ( b
    .bundle()
    .on( 'error', handleErr )
    .pipe( source('bundle.js') )
    .pipe( buffer() )
  ) ;
};

var setBuildEnv = function( opts ){
  process.env['NODE_ENV'] = opts.debug ? 'development' : 'production';
};

var buildJs = function( opts ){
  opts = objectAssign( { debug: true }, opts );

  setBuildEnv( opts );

  return bundle( transform( getBrowserified( opts ) ) )
    .pipe( opts.debug ? streamNop() : $.uglify( require('./.uglify.json') ) )
    .pipe( gulp.dest('build') )
  ;
};

var buildJsDeps = function( opts ){
  opts = objectAssign( {
    debug: true
  }, opts );

  setBuildEnv( opts );

  var b = browserify({
    debug: false
  });

  deps.forEach(function( dep ){
    b.require( dep );
  });

  return ( b
    .bundle()
    .on( 'error', handleErr )
    .pipe( source('deps.js') )
    .pipe( buffer() )
    .pipe( opts.debug ? streamNop() : $.uglify( require('./.uglify.json') ) )
    .pipe( gulp.dest('build') )
  ) ;
};

var buildCss = function( opts ){
  opts = objectAssign( {
    debug: true
  }, opts );

  var s = gulp.src('src/styles/index.css');

  if( opts.debug ){
    s = s.pipe( $.sourcemaps.init() );
  }

  s = ( s
    .pipe(
      $.postcss(
        [
          require('postcss-import')(),
          require('postcss-url')({ url: 'inline', maxSize: Number.MAX_SAFE_INTEGER }),
          require('postcss-cssnext')( require('./.cssnext.json') )
        ].concat(
          opts.debug ? [] : [ require('cssnano')( require('./.cssnano.json') ) ]
        )
      )
    )

    .on( 'error', handleErr )
  );

  if( opts.debug ){
    s = s.pipe( $.sourcemaps.write() );
  }

  return ( s
    .pipe( $.rename('bundle.css') )
    .pipe( gulp.dest('build') )
  );
};

gulp.task('js', function(){
  return buildJs();
});

gulp.task('js-prod', function(){
  return buildJs({ debug: false });
});

gulp.task('js-deps', function(){
  return buildJsDeps();
});

gulp.task('js-deps-prod', function(){
  return buildJsDeps({ debug: false });
});

gulp.task('css', function(){
  return buildCss();
});

gulp.task('css-prod', function(){
  return buildCss({ debug: false });
});

gulp.task('watch', ['css', 'js-deps'], function(){
  setBuildEnv({ debug: true });

  $.livereload.listen({
    basePath: process.cwd()
  });

  var config = require('./src/config');

  nodemon('--debug -e "js json" src/server');

  nodemon.on('restart', function(files){
    $.util.log( $.util.colors.green('Server restarted via watch') );

    files.forEach(function( file ){
      file = file.replace( path.resolve('./'), '' );

      $.util.log( $.util.colors.magenta(file) + ' changed' );
    });
  });

  $.util.log( $.util.colors.green('App hosted on local server at http://localhost:' + config.PORT) );

  gulp.watch( ['src/views/**', 'build/deps.js', 'build/bundle.js', 'build/bundle.css'] )
    .on('change', $.livereload.changed)
  ;

  gulp.watch( ['src/styles/**/*'], ['css'] );

  gulp.watch( ['package.json'], ['js-deps'] );

  var update = function(){
    $.util.log( $.util.colors.white('Client JS rebuilding via watch...') );

    bundle( b )
      .pipe( gulp.dest('build') )
      .on('finish', function(){
        $.util.log( $.util.colors.green('Client JS rebuild finished via watch') );
      })
    ;
  };

  var b = getBrowserified({ debug: true });

  transform( b );

  b.plugin( watchify, { poll: true } );

  b.on( 'update', update );

  update();
});

gulp.task('default', ['watch'], emptyTask);

gulp.task('build', ['js', 'js-deps', 'css'], emptyTask);

gulp.task('build-prod', ['js-prod', 'js-deps-prod', 'css-prod'], emptyTask);

gulp.task('clean', function(){
  return gulp.src('build')
    .pipe( clean() )
  ;
});
