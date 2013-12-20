module.exports = function(grunt) {

    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);
    
    grunt.initConfig({

      svgicons2svgfont: {
        icons: {
          options: {
           font: 'iconsfont',
           appendCodepoints: true
          },
          src: 'documents/icons/*.svg',
          dest: 'www/fonts'
        }
      },

      svg2ttf: {
        icons: {
          src: 'www/fonts/*.svg',
          dest: 'www/fonts'
        }
      },

      ttf2eot: {
        icons: {
          src: 'www/fonts/*.ttf',
          dest: 'www/fonts'
        }
      },

      ttf2woff: {
        icons: {
          src: 'www/fonts/*.ttf',
          dest: 'www/fonts'
        }
      },

      less: {
        main: {
          src: 'documents/less/main.less',
          dest: 'www/css/screen.css'
        }
      },

      css: {
        main: {
          dest: 'www/css/*.css'
        }
      },

      svgmin: {
        dist: {
          files: [{
              expand: true,
              cwd: 'documents/images',
              src: ['**/*.svg'],
              dest: 'www/images/',
              ext: '.svg'
          }]
        }
      },

      browserify: {
        dist: {
            src: 'src/frontend.js',
            dest: 'www/javascript/script.js'
        }
      },

      watch: {
        options: {
          livereload: true
        },
        icons: {
          files: ['documents/icons/*.svg'],
          tasks: ['icons2fonts']
        },
        svgimages: {
          files: ['documents/images/*.svg'],
          tasks: ['svgmin:dist']
        },
        less: {
          files: ['documents/less/*.less'],
          tasks: ['less:main'],
          options: {
            livereload: false
          }
        },
        css: {
          files: ['www/css/home/*.css']
        },
        scripts: {
          files: ['src/javascript/**/*.js']
        },
        frontend: {
          files: ['src/frontend.js', 'src/frontend/**/*.js', 'src/common/**/*.js'],
          tasks: ['browserify:dist']
        }
      }
    });

    grunt.registerTask('icons2fonts', [
        'svgicons2svgfont:icons',
        'svg2ttf:icons',
        'ttf2eot:icons',
        'ttf2woff:icons'
    ]);

    grunt.registerTask('dev', [
        'watch'
    ]);

    grunt.registerTask('dist', [
        'icons2fonts',
        'svgmin:dist',
        'browserify:dist'
    ]);

    grunt.registerTask('default', [
        'dist'
    ]);
};
