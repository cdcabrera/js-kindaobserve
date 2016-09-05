

    var packageJson     = require('./package.json'),
        bowerJson       = require('./bower.json'),
        browserSync     = require('browser-sync'),
        gulp            = require('gulp'),
        jshint          = require('gulp-jshint');

    var settings = {

        version:        (packageJson.version || ''),
        date:           new Date().toDateString(),

        servePath:      './src',
        serveIndex:     'demo.html',

        genericMatch:   ['./src/**/*.md'],
        graphicMatch:   ['./src/**/*.png','./src/**/*.jpg','./src/**/*.gif'],
        jsMatch:        ['./src/**/*.js', '!src/**/*.dev.js', '!src/**/*_spec.js'],
        cssMatch:       ['./src/**/*.css'],

        distDocs:       './docs',
        dist:           './dist',
        jsFileName:     (bowerJson.main[0] || 'dist.js')
    };


    /**
     * JSHint JS files
     */
    gulp.task('js-hint', function () {

        gulp.src(settings.jsMatch)
            .pipe(jshint())
            .pipe(jshint.reporter('default'))
            .pipe(browserSync.reload({ stream: true }));
    });


    /**
     * Serve up app directory and watch for file updates
     */
    gulp.task('start', function () {

        browserSync({
            server: {
                baseDir: settings.servePath,
                index: settings.serveIndex
                //directory:true
            }
        });


        gulp.watch(settings.jsMatch, ['js-hint']);

        gulp
            .watch(settings.jsMatch.concat(settings.cssMatch))
            .on('change', browserSync.reload);
    });


    /**
     * Generate documentation
     */
    gulp.task('docs',function() {

        var docs = browserSync({
            server:{
                baseDir:settings.distDocs,
                index:'index.html'
            }
        });
    });