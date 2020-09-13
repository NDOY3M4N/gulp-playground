const { src, dest, watch, series, parallel } = require('gulp');
const plugins = require('gulp-load-plugins');
const rimraf = require('rimraf');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const browserSync = require('browser-sync').create();
const panini = require('panini');

// Load all Gulp plugins into one variable
const $ = plugins();

// Check if we are in production mode
const PRODUCTION = process.env.NODE_ENV === 'production';

// Define the file path of the resources
const files = {
  scssPath: './src/scss/**/*.scss',
  jsPath: './src/js/**/*.js',
  htmlPath: './src/html/pages/*.{html,hbs,handlebars}',
  imgPath: './src/images/**/*'
};

// Task used for deleting the public folder
function clean(done) {
  rimraf('public', done);
}

// Task used for compiling our Sass files into good old CSS
function sass() {
  return src(files.scssPath)
    .pipe($.if(PRODUCTION, $.sourcemaps.init()))
    .pipe($.sass().on('error', $.sass.logError))
    .pipe($.if(PRODUCTION, $.postcss([
      autoprefixer(),
      cssnano()
    ])))
    .pipe($.if(PRODUCTION, $.sourcemaps.write('.')))
    .pipe(dest('public/css'))
    .pipe(browserSync.stream());
}

// Task used for concatenating all the javascript module into a file
function javascript() {
  return src(files.jsPath)
    .pipe($.babel({ presets: ['@babel/env'] }))
    .pipe($.concat('main.js'))
    .pipe($.uglify())
    .pipe(dest('public/js'));
}

// Task used for compress the file size of our images
function images() {
  return src(files.imgPath)
    .pipe($.imagemin([
      $.imagemin.mozjpeg({quality: 75, progressive: true}),
      $.imagemin.optipng({optimizationLevel: 5}),
    ]))
    .pipe(dest('public/img'));
}

// Task used for compiling our template into static html files
function html() {
  return src(files.htmlPath)
    .pipe(panini({
      root: './src/html/pages/',
      layouts: './src/html/layouts/',
      partials: './src/html/partials/',
      helpers: './src/html/helpers/',
      data: './src/html/data/'
    }))
    .pipe($.rename({ extname: '.html' }))
    .pipe(dest('public'));
}

// Task used for booting a live-server
function server(done) {
  browserSync.init({
    server: "./public/",
    port: 5000
  }, done);
}

// Task used to load updated HTML templates and partials
function resetPages(done) {
  panini.refresh();
  done();
}

// Task used for watching changes inside our assets
function watcher() {
  watch(files.scssPath, sass);
  watch(files.jsPath).on('all', series(javascript, browserSync.reload));
  watch(files.htmlPath).on('all', series(html, browserSync.reload));
  watch([
    'src/html/{layouts,partials}/**/*.{html,hbs,handlebars}',
    'src/html/data/**/*.{js,json,yml}',
    'src/html/helpers/**/*.js'
  ]).on('all', series(resetPages, html, browserSync.reload));  
}

exports.build = series(clean, parallel(sass, javascript, html, images), server, watcher);
exports.default = series(clean, parallel(sass, javascript, html, images));
