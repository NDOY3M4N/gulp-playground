const { src, dest, watch, series, parallel } = require('gulp');
const plugins = require('gulp-load-plugins');
const rimraf = require('rimraf');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const browserSync = require('browser-sync').create();

// Load all Gulp plugins into one variable
const $ = plugins({
  rename: {
    'gulp-nunjucks-render': 'nunjucks'
  }
});

// Check if we are in production mode
const PRODUCTION = process.env.NODE_ENV === 'production';

// Define the file path of the resources
const files = {
  scssPath: 'src/scss/**/*.scss',
  jsPath: 'src/js/**/*.js',
  htmlPath: 'src/html/pages/*.njk',
  imgPath: 'src/images/**/*'
};

function clean(next) {
  rimraf('public', next);
}

function sass() {
  return src(files.scssPath)
    .pipe($.if(!PRODUCTION, $.sourcemaps.init()))
    .pipe($.sass().on('error', $.sass.logError))
    .pipe($.postcss([
      autoprefixer({ Browserslist: ['last 2 versions', 'ie >= 9'] }),
      cssnano()
    ]))
    .pipe($.if(!PRODUCTION, $.sourcemaps.write('.')))
    .pipe(dest('public/css'))
    .pipe(browserSync.stream());
}

function javascript() {
  return src(files.jsPath)
    .pipe($.concat('main.js'))
    .pipe($.uglify())
    .pipe(dest('public/js'));
}

function images(cb) {
  return src(files.imgPath)
    .pipe($.imagemin([
      $.imagemin.mozjpeg({quality: 75, progressive: true}),
      $.imagemin.optipng({optimizationLevel: 5}),
    ]))
    .pipe(dest('public/img'));
}

function nunjucks() {
  return src(files.htmlPath)
    .pipe($.nunjucks({
      path: ['src/html/templates'],
      data: {
        cssPath: 'css/',
        jsPath: 'js/',
        imgPath: 'img/'
      }
    })) // Renders template with nunjucks
    .pipe(dest('public'))
    .pipe(browserSync.stream());
}

function cacheBust(){
    const cbString = Math.floor(Math.random() * 1000)

    return src('public/index.html')
      .pipe($.replace(/cb=\d+/g, 'cb=' + cbString))
      .pipe(dest('.'));
}

function server() {
  browserSync.init({
    server: "./public/",
    port: 5000
  });

  watch(files.scssPath, sass);
  watch(files.htmlPath, nunjucks).on('change', browserSync.reload);
}

exports.build = series(clean, parallel(sass, javascript, nunjucks, images), server);
exports.default = series(clean, parallel(sass, javascript, nunjucks, images));
