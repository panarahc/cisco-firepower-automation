var gulp = require('gulp');
var uglifyjs = require('uglify-es');
var composer = require('gulp-uglify/composer');
var pump = require('pump');
var rename = require('gulp-rename');
var javascriptObfuscator = require('gulp-javascript-obfuscator');

var minify = composer(uglifyjs, console);

gulp.task('compress', function(cb) {
    var options = {};

    pump([
            gulp.src('default.js'),
            minify(options),
            rename({ suffix: '-min' }),
            gulp.dest('public')
        ],
        cb
    );
});

gulp.task('obfuscate', function(cb) {
    pump([
            gulp.src('default.js'),
            javascriptObfuscator(),
            rename({ suffix: '-min' }),
            gulp.dest('public')
        ],
        cb
    );
});