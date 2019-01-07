const gulp = require("gulp");
const concat_js = require("gulp-concat");
const minify_js = require("gulp-uglify-es").default;
const minify_css = require("gulp-csso");
const browserSync = require("browser-sync").create();
const rename = require("gulp-rename");
const babelify = require("gulp-babel");
const concat_css = require("gulp-concat-css");
const watch = require("gulp-watch");
const sass = require("gulp-sass");
const sourcemaps = require("gulp-sourcemaps");

gulp.task("scss", () => {
  return gulp
    .src("app/css/src/index.scss")
    .pipe(sourcemaps.init())
    .pipe(sass().on("error", sass.logError))
    .pipe(minify_css())
    .pipe(rename("style.min.css"))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest("app/css/dist"));
});

gulp.task("js", () => {
  return gulp
    .src([
      "app/js/src/app.module.js",
      "app/js/src/routes.module.js",
      "app/js/src/factories/**/*.js",
      "app/js/src/controllers/*.js",
      "app/js/src/directives/*.js",
      "app/js/src/filters/*.js"
    ])
    .pipe(sourcemaps.init())
    .pipe(concat_js("app/js/dist/app.js"))
    .pipe(
      babelify({
        presets: ["env"]
      })
    )
    .pipe(
      minify_js({
        mangle: false
      })
    )
    .pipe(rename("app.min.js"))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest("app/js/dist"));
});

var uglify = require("gulp-uglify");
const mainBowerFiles = require("gulp-main-bower-files");
const filter = require("gulp-filter");
const jsFilter = filter("**/*.js", { restore: true });

gulp.task("bower", function() {
  return gulp
    .src("./app/libs/bower.json")
    .pipe(mainBowerFiles())
    .pipe(jsFilter)
    .pipe(concat_js("vendor.js"))
    .pipe(uglify())
    .pipe(gulp.dest("./app/js/dist"));
});

gulp.task("browser-sync", () => {
  browserSync.init({
    server: {
      baseDir: "./app",
      browser: "chrome",
      port: 1337
    }
  });
  gulp.watch("app/css/src/*.scss", ["scss"]).on("change", browserSync.reload);
  gulp
    .watch(
      [
        "app/js/src/app.module.js",
        "app/js/src/routes.module.js",
        "app/js/src/factories/**/*.js",
        "app/js/src/controllers/*.js",
        "app/js/src/directives/*.js",
        "app/js/src/filters/*.js"
      ],
      ["js"]
    )
    .on("change", browserSync.reload);

  gulp.watch("app/index.html").on("change", browserSync.reload);

  gulp.watch("app/partials/*.html").on("change", browserSync.reload);
});

gulp.task("build", ["scss", "js"]);

gulp.task("default", ["scss", "js", "browser-sync"]);
