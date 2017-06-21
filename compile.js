// Generated by LiveScript 1.5.0
(function(){
  var fs, reactify, browserifyInc, livescript, browserify, xtend, commander, sassc, watch, save, setupWatch, compile;
  fs = require('fs');
  reactify = require('reactify-ls');
  browserifyInc = require('browserify-incremental');
  livescript = require('livescript');
  browserify = require('browserify');
  xtend = require('xtend');
  commander = require('commander');
  sassc = require('node-sass');
  watch = require('node-watch');
  save = function(file, content){
    console.log("Save " + file);
    return fs.writeFileSync(file, content);
  };
  setupWatch = function(commander){
    setupWatch.enabled = true;
    if (setupWatch.$) {
      return;
    }
    setupWatch.$ = true;
    return watch('./', {
      recursive: true,
      filter: function(name){
        return !/node_modules/.test(name) && !/\.git/.test(name);
      }
    }, function(){
      if (setupWatch.enabled === false) {
        return;
      }
      return compile(commander);
    });
  };
  compile = function(commander){
    var basedir, file, target, ref$, bundle, html, sass, compilesass, input, code, js, state, err, makeBundle, print;
    setupWatch.enabled = false;
    basedir = process.cwd();
    console.log("Current Directory " + basedir);
    file = commander.compile;
    if (file == null) {
      return console.error('File is required');
    }
    target = (ref$ = commander.target) != null ? ref$ : file;
    bundle = commander.bundle === true
      ? 'bundle'
      : commander.bundle;
    html = commander.html === true
      ? 'index'
      : commander.html;
    sass = commander.sass === true
      ? 'style'
      : commander.sass;
    compilesass = commander.compilesass === true
      ? 'style'
      : commander.compilesass;
    input = file + ".ls";
    console.log("Compile " + input);
    code = reactify(fs.readFileSync(input).toString('utf-8'));
    js = livescript.compile(code.ls);
    save(target + ".js", js);
    if (sass != null) {
      save(sass + ".sass", code.sass);
    }
    if (compilesass != null) {
      console.log("Compile SASS");
      state = {
        css: ""
      };
      try {
        state.css = sassc.renderSync({
          data: code.sass,
          indentedSyntax: true
        });
        save(compilesass + ".css", state.css.css);
      } catch (e$) {
        err = e$;
        console.error("Compile SASS Error " + ((ref$ = err.message) != null ? ref$ : err));
      }
    }
    makeBundle = function(file, callback){
      var options, b, bundle, string;
      options = {
        basedir: basedir,
        paths: [basedir + "/node_modules"],
        debug: false,
        commondir: false,
        entries: [file]
      };
      b = browserify(xtend(browserifyInc.args, options));
      browserifyInc(b, {
        cacheFile: file + ".cache"
      });
      bundle = b.bundle();
      string = "";
      bundle.on('data', function(data){
        return string += data.toString();
      });
      bundle.on('error', function(error){});
      return bundle.on('end', function(_){
        callback(null, string);
      });
    };
    if (commander.bundle != null) {
      makeBundle(target + ".js", function(err, bundlec){
        if (err == null) {
          save(bundle + ".js", bundlec);
        } else {
          console.error(err);
        }
      });
    }
    if (commander.html != null) {
      print = '<!DOCTYPE html>\n<html lang="en-us">\n  <head>\n   <meta charset="utf-8">\n   <title>Hello...</title>\n   <link rel="stylesheet" type="text/css" href="./style.css">\n  </head>\n  <script type="text/javascript" src="./bundle.js"></script>\n</html>';
      save(html + ".html", print);
    }
    if (commander.watch) {
      return setupWatch(commander);
    }
  };
  module.exports = compile;
}).call(this);
