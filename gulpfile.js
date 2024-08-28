const {src, dest, watch, series, parallel} = require('gulp');
const rename       = require('gulp-rename');
const plubmer      = require('gulp-plumber');
const del          = require('del');
const sass         = require('gulp-sass')(require('sass'));
const sourcemaps   = require('gulp-sourcemaps');
const babel        = require('gulp-babel');
const babel_minify = require('gulp-babel-minify');
const theme_path   = './';

const dev_dir = {
  root: theme_path + 'src',
  styles: theme_path + 'src/scss',
  scripts: theme_path + 'src/js',
}

const prod_dir = {
  root: theme_path,
  styles: theme_path + 'dist/css',
  scripts: theme_path + 'dist/js',
}

function clean() {
  return del([prod_dir.styles + '/*', prod_dir.scripts + '/*']);
}

function cleanScripts() {
  return del([prod_dir.scripts + '/*']);
}

function cleanStyles() {
  return del([prod_dir.styles + '/*']);
}

function compileStylesDev() {
  return src(dev_dir.styles + '/styles.scss')
    .pipe(plubmer())
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(sourcemaps.write())
    .pipe(rename({suffix: '.min'}))
    .pipe(dest(prod_dir.styles));
}

function compileStylesProd() {
  return src(dev_dir.styles + '/styles.scss')
    .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(rename({suffix: '.min'}))
    .pipe(dest(prod_dir.styles));
}

function compileScriptsDev() {
  return src(dev_dir.scripts + '/*.js')
    .pipe(babel({
      presets: ['@babel/env']
    }))
    .pipe(rename({suffix: '.min'}))
    .pipe(dest(prod_dir.scripts));
}

function compileScriptsProd() {
  return src(dev_dir.scripts + '/*.js')
    .pipe(babel({
      presets: ['@babel/env']
    }))
    .pipe(babel_minify({
      mangle: {
        keepClassName: true
      }
    }))
    .pipe(rename({suffix: '.min'}))
    .pipe(dest(prod_dir.scripts));
}

function watchFiles() {
  return watch([dev_dir.styles + '/**/*.scss', dev_dir.scripts + '/**/*.js'], series(compileStylesDev, compileScriptsDev));
}

exports.watchFiles         = watchFiles;
exports.projectStart       = series(clean, compileStylesDev, compileScriptsDev, watchFiles);
exports.compileStylesDev   = series(cleanStyles, compileStylesDev);
exports.compileStylesProd  = series(cleanStyles, compileStylesProd);
exports.compileScriptsDev  = series(cleanScripts, compileScriptsDev);
exports.compileScriptsProd = series(cleanScripts, compileScriptsProd);
exports.buildDev           = series(clean, compileStylesDev, compileScriptsDev);
exports.buildProd          = series(clean, compileStylesProd, compileScriptsProd);

