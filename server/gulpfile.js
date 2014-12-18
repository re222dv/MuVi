var gulp = require('gulp');
var istanbul = require('gulp-istanbul');
var mocha = require('gulp-mocha');
var traceur = require('traceur');
var istanbulTraceur = require('istanbul-traceur');

// Set up Traceur before importing es6 code
traceur.require.makeDefault(function (filename) {
  // don't transpile our dependencies, just our app
  return filename.indexOf('node_modules') === -1;
});

gulp.task('test', function (cb) {
  var usedIstanbul = require('istanbul');
  var Instrumenter = usedIstanbul.Instrumenter;

  // Overrides `Instrumenter`
  usedIstanbul.Instrumenter = istanbulTraceur.Instrumenter;

  gulp.src([ 'lib/**/*.js' ])
    .pipe(istanbul())
    .on('finish', function () {

      gulp.src([ 'test/specs/**/*.js' ])
        .pipe(mocha())
        .pipe(istanbul.writeReports())
        .on('end', function (err) {
          // Restores original `Instrumenter`
          usedIstanbul.Instrumenter = Instrumenter;
          cb(err);
        });
    });
});
