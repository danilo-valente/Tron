var gulp = require('gulp');
var gutil = require('gulp-util');
var template = require('gulp-template');
var uglify = require('gulp-uglify');
var beautify = require('gulp-beautify');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var notify = require('gulp-notify');
var rename = require('gulp-rename');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var globalShim = require('browserify-global-shim').configure({ moment: 'moment' });
var lazypipe = require('lazypipe');
var prettyBytes = require('pretty-bytes');
var runSequence = require('run-sequence');
var jasmine = require('gulp-jasmine');

var PACKAGE = require('./package.json');

var SRC = ['index.js', 'lib/**'];
var SPEC = 'spec/**/*.spec.js';
var DIST = 'dist';

/*
 * Recipes
 */

var notifyErrorRecipe = function () {
    return notify.onError(function (err) {
        return 'Error: ' + (typeof err === 'string' ? err : err.message);
    });
};

var browserifyRecipe = function (src, namespace, fileSource, listenToErrors) {
    var stream = browserify(src, { standalone: namespace })
        .transform(globalShim)
        .bundle();

    if (listenToErrors) {
        stream.on('error', notifyErrorRecipe());
    }

    return stream
        .pipe(source(fileSource))
        .pipe(buffer());
};

var notifySizeRecipe = function () {
    return notify({
        onLast: true,
        message: function (file) {
            return file.relative + ' file size: ' + prettyBytes(file.contents.length);
        }
    });
};

var uglifyRecipe = lazypipe()
    .pipe(uglify)
    .pipe(rename, { suffix: '.min' })
    .pipe(notifySizeRecipe);

var beautifyRecipe = lazypipe()
    .pipe(template, { version: PACKAGE.version })
    .pipe(beautify)
    .pipe(notifySizeRecipe);

var jshintRecipe = lazypipe()
    .pipe(jshint)
    .pipe(jshint.reporter, stylish);

var testRecipe = function (listenToErrors) {
    var stream = jasmine({
        includeStackTrace: true,
        verbose: true
    });

    if (listenToErrors) {
        stream.on('error', notifyErrorRecipe());
    }

    return stream;
};

/*
 * Tasks
 */

gulp.task('lint', function () {
    return gulp.src(SRC)
        .pipe(jshintRecipe());
});

gulp.task('bundle', function () {
    return browserifyRecipe('index.js', 'Tron', 'tron.js')
        .pipe(beautifyRecipe())
        .pipe(gulp.dest(DIST))
        .pipe(uglifyRecipe())
        .pipe(gulp.dest(DIST));
});

gulp.task('test', function () {
    return gulp.src(SPEC)
        .pipe(testRecipe());
});

gulp.task('build', function (cb) {
    runSequence('lint', 'test', 'bundle', function (err) {
        if (err) {
            gutil.log(err.message);
            notifyErrorRecipe()(err.message);
        }
        cb(null);
    });
});

gulp.task('default', ['build'], function () {
    var files = [].concat(SRC, SPEC);
    gulp.watch(files, ['build']);
});