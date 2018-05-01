const gulp = require('gulp');

const themeName = require('./package.json').name;

// gulp plugins and utils
const gutil = require('gulp-util');
const livereload = require('gulp-livereload');
const postcss = require('gulp-postcss');
const sourcemaps = require('gulp-sourcemaps');
const zip = require('gulp-zip');

// postcss plugins
const autoprefixer = require('autoprefixer');
const colorFunction = require('postcss-color-function');
const cssnano = require('cssnano');
const customProperties = require('postcss-custom-properties');
const easyimport = require('postcss-easy-import');

const swallowError = (error) => {
    gutil.log(error.toString());
    gutil.beep();
    this.emit('end');
};

const nodemonServerInit = () => {
    livereload.listen(1234);
};

gulp.task('css', () => {
    const processors = [
        easyimport,
        customProperties,
        colorFunction(),
        autoprefixer(),
        cssnano(),
    ];

    return gulp.src('assets/css/*.css')
        .on('error', swallowError)
        .pipe(sourcemaps.init())
        .pipe(postcss(processors))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('assets/built/'))
        .pipe(livereload());
});

gulp.task('build', gulp.series('css', () => nodemonServerInit()));

gulp.task('watch', () => {
    gulp.watch('assets/css/**/*', gulp.series('css'));
});

gulp.task('zip', gulp.series('css', () => {
    const targetDir = 'dist/';
    const filename = `${themeName}.zip`;

    return gulp.src([
        '**/*',
        '!src', '!src/**/*',
        '!node_modules', '!node_modules/**/*',
        '!dist', '!dist/**/*',
    ], { followSymlinks: false })
        .pipe(zip(filename))
        .pipe(gulp.dest(targetDir));
}));

gulp.task('default', gulp.parallel('build', 'watch'));
