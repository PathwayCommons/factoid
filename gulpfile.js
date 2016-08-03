var process = require('process');
var objectAssign = require('object-assign');
var gulp = require('gulp');
var livereload = require('gulp-livereload');
var browserify = require('browserify');
var babelify = require('babelify');
var watchify = require('watchify');
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
var config = require('./src/config');
var path = require('path');

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
  opts = objectAssign({
    debug: true,
    cache: {},
    packageCache: {},
    fullPaths: true,
    bundleExternal: true,
    entries: [ './src/client' ]
  }, opts );

  return browserify( opts ).on( 'log', $.util.log );
};

var transform = function( b ){
  return ( b
    .transform( babelify.configure({
      presets: ['es2015'],
      ignore: 'node_modules/**/*',
      sourceMaps: 'inline'
    }) )
    .external( deps )
  ) ;
};

var bundle = function( b ){
  return ( b
    .bundle()
    .on( 'error', handleErr )
    .pipe( source('app.js') )
    .pipe( buffer() )
  ) ;
};

gulp.task('js', function(){
  return bundle( transform( getBrowserified() ) )
    .pipe( gulp.dest('./build') )
  ;
});

gulp.task('js-deps', function(){
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
    .pipe( gulp.dest('./build') )
  ) ;
});

var less = function( s ){
  return ( s
    .pipe( $.sourcemaps.init() )

    .pipe( $.less({
      paths: ['./src/styles'],
      sourceMap: true,
      relativeUrls: true,
      sourceMapRootpath: '../',
      sourceMapBasepath: process.cwd()
    }) )
      .on( 'error', handleErr )

    .pipe( $.sourcemaps.write() )
    .pipe( $.rename('app.css') )
    .pipe( gulp.dest('./build') )
  );
};

gulp.task('css', function(){
  return less( gulp.src('./src/styles/index.less') );
});

gulp.task('watch', ['css', 'js-deps'], function(){
  $.livereload.listen({
    basePath: process.cwd()
  });

  nodemon('--debug -e "js json" ./src/server');

  nodemon.on('restart', function(files){
    $.util.log( $.util.colors.green('Server restarted via watch') );

    files.forEach(function( file ){
      file = file.replace( path.resolve('./'), '' );

      $.util.log( $.util.colors.magenta(file) + ' changed' );
    });
  });

  $.util.log( $.util.colors.green('App hosted on local server at http://localhost:' + config.PORT) );

  gulp.watch( ['./src/views/index.html', './build/deps.js', './build/app.js', './build/app.css'] )
    .on('change', $.livereload.changed)
  ;

  gulp.src( './src/less/app.less' )
    .pipe( $.plumber() )
    .pipe( $.watchLess('./src/less/app.less', function(){
      runSequence('css');
    }) )
    .on( 'error', handleErr )
  ;

  gulp.watch( ['./package.json'], ['js-deps'] );

  var update = function(){
    $.util.log( $.util.colors.white('Client JS rebuilding via watch...') );

    bundle( b )
      .pipe( gulp.dest('./build') )
      .on('finish', function(){
        $.util.log( $.util.colors.green('Client JS rebuild finished via watch') );
      })
    ;
  };

  var b = getBrowserified();

  transform( b );

  b.plugin( watchify, { poll: true } );

  b.on( 'update', update );

  update();
});

gulp.task('default', ['watch'], emptyTask);

gulp.task('build', ['js', 'js-deps', 'css'], emptyTask);

gulp.task('clean', function(){
  return gulp.src('./build')
    .pipe( clean() )
  ;
});

gulp.task('test', function(){
  return gulp.src('test/*.js')
    .pipe( $.mocha() )
  ;
});
