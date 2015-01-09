'use strict';
var LIVERELOAD_PORT = 35729;
var lrSnippet = require('connect-livereload')({port: LIVERELOAD_PORT});
var mountFolder = function (connect, dir) {
  return connect.static(require('path').resolve(dir));
};

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to match all subfolders:
// 'test/spec/**/*.js'

module.exports = function (grunt) {
  // show elapsed time at the end
  require('time-grunt')(grunt);
  // load all grunt tasks
  require('load-grunt-tasks')(grunt);

  // configurable paths
  var yeomanConfig = {
    app: 'app',
    dist: 'dist'
  };

  grunt.initConfig({
    yeoman: yeomanConfig,
    watch: {
      options: {
        nospawn: true,
        livereload: {liveCSS: false}
      },
      livereload: {
        options: {
          livereload: true
        },
        files: [
          '<%= yeoman.app %>/*.html',
          '<%= yeoman.app %>/elements/{,*/}*.html',
          '{.tmp,<%= yeoman.app %>}/elements/{,*/}*.css',
          '{.tmp,<%= yeoman.app %>}/elements/{,*/}*.js',
          '{.tmp,<%= yeoman.app %>}/styles/{,*/}*.css',
          '{.tmp,<%= yeoman.app %>}/scripts/{,*/}*.js',
          '<%= yeoman.app %>/images/{,*/}*.{png,jpg,jpeg,gif,webp}'
        ]
      },
      js: {
        files: [
          '<%= yeoman.app %>/scripts/{,*/}*.js',
          '<%= yeoman.app %>/elements/{,*/}*.js'
        ],
        tasks: ['traceur:server']
      },
      styles: {
        files: [
          '<%= yeoman.app %>/styles/{,*/}*.css',
          '<%= yeoman.app %>/elements/{,*/}*.css'
        ],
        tasks: ['copy:styles', 'autoprefixer:server']
      },
      sass: {
        files: [
          '<%= yeoman.app %>/styles/{,*/}*.{scss,sass}',
          '<%= yeoman.app %>/elements/{,*/}*.{scss,sass}'
        ],
        tasks: ['sass:server', 'autoprefixer:server']
      }
    },
    // Compiles Sass to CSS and generates necessary files if requested
    sass: {
      options: {
        //sourcemap: true,
        loadPath: 'bower_components'
      },
      dist: {
        options: {
          style: 'compressed'
        },
        files: [{
          expand: true,
          cwd: '<%= yeoman.app %>',
          src: ['styles/{,*/}*.{scss,sass}', 'elements/{,*/}*.{scss,sass}'],
          dest: '<%= yeoman.dist %>',
          ext: '.css'
        }]
      },
      server: {
        files: [{
          expand: true,
          cwd: '<%= yeoman.app %>',
          src: ['styles/{,*/}*.{scss,sass}', 'elements/{,*/}*.{scss,sass}'],
          dest: '.tmp',
          ext: '.css'
        }]
      }
    },
    autoprefixer: {
      options: {
        browsers: ['last 2 versions']
      },
      server: {
        files: [{
          expand: true,
          cwd: '.tmp',
          src: '**/*.css',
          dest: '.tmp'
        }]
      },
      dist: {
        files: [{
          expand: true,
          cwd: '<%= yeoman.dist %>',
          src: ['**/*.css', '!bower_components/**/*.css'],
          dest: '<%= yeoman.dist %>'
        }]
      }
    },
    connect: {
      options: {
        port: 9000,
        // change this to '0.0.0.0' to access the server from outside
        hostname: 'localhost'
      },
      proxies: [
        {
          context: '/api',
          host: '127.0.0.1',
          port: 9099,
          https: false,
          xforward: false
        },
        {
          context: '/auth',
          host: '127.0.0.1',
          port: 9099,
          https: false,
          xforward: false
        },
      ],
      livereload: {
        options: {
          middleware: function (connect) {
            // Setup the proxy
            var middlewares = [require('grunt-connect-proxy/lib/utils').proxyRequest];

            return middlewares.concat([
              lrSnippet,
              mountFolder(connect, '.tmp'),
              mountFolder(connect, yeomanConfig.app)
            ]);
          }
        }
      },
      test: {
        options: {
          open: {
            target: 'http://localhost:<%= connect.options.port %>/test'
          },
          middleware: function (connect) {
            return [
              mountFolder(connect, yeomanConfig.app)
            ];
          },
          keepalive: true
        }
      },
      dist: {
        options: {
          middleware: function (connect) {
            return [
              mountFolder(connect, yeomanConfig.dist)
            ];
          }
        }
      }
    },
    open: {
      server: {
        path: 'http://localhost:<%= connect.options.port %>'
      }
    },
    clean: {
      dist: ['.tmp', '<%= yeoman.dist %>/*'],
      server: '.tmp'
    },
    jshint: {
      options: {
        jshintrc: '../.jshintrc',
        reporter: require('jshint-stylish')
      },
      all: [
        '<%= yeoman.app %>/scripts/{,*/}*.js',
        '!<%= yeoman.app %>/scripts/vendor/*',
        'test/spec/{,*/}*.js'
      ]
    },
    useminPrepare: {
      html: '<%= yeoman.app %>/index.html',
      options: {
        dest: '<%= yeoman.dist %>'
      }
    },
    usemin: {
      html: ['<%= yeoman.dist %>/{,*/}*.html'],
      css: ['<%= yeoman.dist %>/styles/{,*/}*.css'],
      options: {
        dirs: ['<%= yeoman.dist %>'],
        blockReplacements: {
          vulcanized: function (block) {
            return '<link rel="import" href="' + block.dest + '">';
          }
        },
        flow: {
          steps: {
            js: ['concat', 'traceur', 'uglifyjs'],
            css: ['concat', 'cssmin']
          },
          post: []
        }
      }
    },
    vulcanize: {
      default: {
        options: {
          strip: true,
          inline: true
        },
        files: {
          '<%= yeoman.dist %>/elements/elements.vulcanized.html': [
            '<%= yeoman.dist %>/elements/elements.html'
          ]
        }
      }
    },
    imagemin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= yeoman.app %>/images',
          src: '{,*/}*.{png,jpg,jpeg}',
          dest: '<%= yeoman.dist %>/images'
        }]
      }
    },
    minifyHtml: {
      options: {
        quotes: true,
        empty: true
      },
      app: {
        files: [{
          expand: true,
          cwd: '<%= yeoman.dist %>',
          src: '*.html',
          dest: '<%= yeoman.dist %>'
        }]
      }
    },
    copy: {
      dist: {
        files: [{
          expand: true,
          dot: true,
          cwd: '<%= yeoman.app %>',
          dest: '<%= yeoman.dist %>',
          src: [
            '*.{ico,txt,png,appcache,xml}',
            '.htaccess',
            '*.html',
            'elements/**',
            '!elements/**/*.scss',
            'images/{,*/}*.{webp,gif,svg}',
            'bower_components/**'
          ]
        }]
      },
      styles: {
        files: [{
          expand: true,
          cwd: '<%= yeoman.app %>',
          dest: '.tmp',
          src: ['{styles,elements}/{,*/}*.css']
        }]
      }
    },
    // See this tutorial if you'd like to run PageSpeed
    // against localhost: http://www.jamescryer.com/2014/06/12/grunt-pagespeed-and-ngrok-locally-testing/
    pagespeed: {
      options: {
        // By default, we use the PageSpeed Insights
        // free (no API key) tier. You can use a Google
        // Developer API key if you have one. See
        // http://goo.gl/RkN0vE for info
        nokey: true
      },
      // Update `url` below to the public URL for your site
      mobile: {
        options: {
          url: "https://developers.google.com/web/fundamentals/",
          locale: "en_GB",
          strategy: "mobile",
          threshold: 80
        }
      }
    },
    traceur: {
      options: {
        modules: 'inline',
      },
      custom: {
        files: [{
          expand: true,
          cwd: 'src/es6',
          src: ['*.js'],
          dest: 'src/es5'
        }]
      },
      dist: {
        files: [{
          expand: true,
          cwd: '<%= yeoman.app %>',
          src: ['scripts/{,*/}*.js', 'elements/{,*/}*.js'],
          dest: '<%= yeoman.dist %>'
        }]
      },
      server: {
        files: [{
          expand: true,
          cwd: '<%= yeoman.app %>',
          src: ['scripts/{,*/}*.js', 'elements/{,*/}*.js'],
          dest: '.tmp'
        }]
      }
    },
    rewrite: {
      localhost: {
        src: '<%= yeoman.dist %>/**/*',
        editor: function (contents) {
          return contents.replace(/http:\/\/localhost:9099/g, '');
        }
      },
      polyfill: {
        src: '<%= yeoman.dist %>/index.html',
        editor: function (contents) {
          return contents.replace(/bower_components\/webcomponentsjs\/webcomponents\.js/g,
            'bower_components/webcomponentsjs/webcomponents.min.js');
        }
      },
    },
  });

  grunt.registerTask('server', function (target) {
    grunt.log.warn('The `server` task has been deprecated. Use `grunt serve` to start a server.');
    grunt.task.run(['serve:' + target]);
  });

  grunt.registerTask('serve', function (target) {
    if (target === 'dist') {
      return grunt.task.run(['build', 'open', 'connect:dist:keepalive']);
    }

    grunt.task.run([
      'clean:server',
      'sass:server',
      'traceur:server',
      'copy:styles',
      'autoprefixer:server',
      'configureProxies:server',
      'connect:livereload',
      //'open',
      'watch'
    ]);
  });

  grunt.registerTask('test', [
    'clean:server',
    'connect:test'
  ]);

  grunt.registerTask('build', [
    'clean:dist',
    'sass',
    'copy',
    'traceur:dist',
    'rewrite:localhost',
    'useminPrepare',
    'imagemin',
    'concat',
    'autoprefixer',
    'uglify',
    'vulcanize',
    'usemin',
    'minifyHtml',
    'rewrite:polyfill',
  ]);

  grunt.registerTask('default', [
    //'jshint',
    // 'test'
    'build'
  ]);
};
