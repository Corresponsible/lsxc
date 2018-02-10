// Generated by LiveScript 1.5.0
(function(){
  var fs, through, reactify, browserifyInc, livescript, browserify, xtend, sassc, watch, fixIndents, ref$, red, yellow, gray, green, express, vm, encrypt, basedir, compileddir, baseTitle, title, error, warn, save, saveOrigin, setupWatch, serverStart, compileFile, compile;
  fs = require('fs');
  through = require('through');
  reactify = require('reactify-ls');
  browserifyInc = require('browserify-incremental');
  livescript = require('livescript');
  browserify = require('browserify');
  xtend = require('xtend');
  sassc = require('node-sass');
  watch = require('node-watch');
  fixIndents = require('fix-indents');
  ref$ = require('chalk'), red = ref$.red, yellow = ref$.yellow, gray = ref$.gray, green = ref$.green;
  express = require('express');
  vm = require('vm');
  encrypt = require('javascrypt').encrypt;
  basedir = process.cwd();
  compileddir = basedir + "/.compiled";
  baseTitle = curry$(function(colored, symbol, text){
    var max;
    text = "[" + colored(symbol) + "] " + colored(text);
    max = 40 - text.length;
    if (max <= 0) {
      return text;
    } else {
      return text + (function(){
        var i$, to$, results$ = [];
        for (i$ = 0, to$ = max; i$ <= to$; ++i$) {
          results$.push(i$);
        }
        return results$;
      }()).map(function(){
        return " ";
      }).join('');
    }
  });
  title = baseTitle(green, "✓");
  error = baseTitle(red, "x");
  warn = baseTitle(yellow, "!");
  if (!fs.existsSync(compileddir)) {
    fs.mkdir(compileddir);
  }
  save = function(file, content){
    return saveOrigin(compileddir + "/" + file, content);
  };
  saveOrigin = function(file, content){
    console.log(title('save') + " " + file);
    return fs.writeFileSync(file, content);
  };
  setupWatch = function(commander){
    var watcher;
    if (setupWatch.init) {
      return;
    }
    console.log(warn("watcher started..."));
    setupWatch.init = true;
    return watcher = watch(basedir, {
      recursive: true,
      filter: function(name){
        return !/(node_modules|\.git)/.test(name);
      }
    }, function(evt, name){
      if (setupWatch.disabled) {
        return;
      }
      console.log(warn('changed') + " " + name);
      setupWatch.disabled = true;
      return compile(commander, function(err){
        setTimeout(function(){
          setupWatch.disabled = false;
        }, 500);
      });
    });
  };
  serverStart = function(commander){
    var app, port, start, script, context;
    if (serverStart.init) {
      return;
    }
    serverStart.init = true;
    app = express();
    app.use(express['static'](compileddir));
    port = commander.nodestart === true
      ? 8080
      : commander.nodestart;
    start = function(){
      return app.listen(port, function(){
        return console.log(warn('node started') + " port " + port);
      });
    };
    script = new vm.Script("(" + start.toString() + ")()");
    context = new vm.createContext({
      port: port,
      app: app,
      console: console,
      warn: warn
    });
    script.runInContext(context);
    return port;
  };
  compileFile = function(input, data){
    var code, state, err, errorline, ref$, lines, index;
    console.log(title('compile') + " " + input);
    code = reactify(data);
    state = {
      js: null
    };
    try {
      state.js = livescript.compile(code.ls);
    } catch (e$) {
      err = e$;
      state.err = err.message;
      errorline = (ref$ = err.message.match(/line ([0-9]+)/)[1]) != null ? ref$ : 0;
      lines = code.ls.split('\n');
      for (index in lines) {
        if (index === errorline) {
          lines[index] = lines[index] + ("       <<< " + red(err.message));
        } else {
          lines[index] = gray(lines[index]);
        }
      }
      console.log(([].concat(lines)).join('\n'));
    }
    return {
      ls: code.ls,
      sass: code.sass,
      js: state.js,
      err: state.err
    };
  };
  compile = function(commander, cb){
    var cb2, file, sassCache, path, sassC, filename, bundle, bundleJs, bundleCss, html, bundleHtml, sass, compilesass, ref$, makeBundle;
    console.log("----------------------");
    cb2 = function(err, data){
      if (err != null) {
        console.log(red('Error') + " err");
      }
      return typeof cb == 'function' ? cb(err, data) : void 8;
    };
    file = commander.compile;
    sassCache = (path = compileddir + "/" + file + ".sass.cache", {
      save: function(obj){
        return fs.writeFileSync(path, JSON.stringify(obj));
      },
      load: function(){
        if (!fs.existsSync(path)) {
          return {};
        }
        return JSON.parse(fs.readFileSync(path).toString('utf8'));
      }
    });
    sassC = sassCache.load();
    filename = file.replace(/\.ls/, '');
    if (file == null) {
      return cb2('File is required');
    }
    bundle = commander.bundle === true
      ? 'bundle'
      : commander.bundle;
    bundleJs = filename + "-" + bundle + ".js";
    bundleCss = filename + "-" + bundle + ".css";
    html = commander.html === true
      ? 'index'
      : commander.html;
    bundleHtml = filename + "-" + html + ".html";
    sass = commander.sass === true
      ? 'style'
      : commander.sass;
    compilesass = commander.compilesass === true
      ? 'style'
      : commander.compilesass;
    sassC[commander.compile] = (ref$ = sassC[commander.compile]) != null
      ? ref$
      : {};
    makeBundle = function(file, callback){
      var options, b, bundle, string;
      console.log(title('start main file') + " " + file);
      options = {
        basedir: basedir,
        paths: [basedir + "/node_modules"],
        debug: false,
        commondir: false,
        entries: [file]
      };
      b = browserify(xtend(browserifyInc.args, options));
      b.transform(function(file){
        var filename, ref$, data, write, end;
        filename = (ref$ = file.match(/([a-z-0-9_]+)\.ls$/)) != null ? ref$[1] : void 8;
        data = '';
        write = function(buf){
          return data += buf;
        };
        end = function(){
          var t, send, code, indented, sassConf, err;
          t = this;
          send = function(data){
            t.queue(data);
            return t.queue(null);
          };
          if (filename == null) {
            return send(data);
          }
          code = compileFile(file, data);
          if (sass != null) {
            save(filename + ".sass", code.sass);
          }
          if (commander.fixindents) {
            indented = fixIndents(data);
            if (data !== indented) {
              console.log(title('fix indents') + " " + file);
              saveOrigin(file, indented);
            }
          }
          if (compilesass != null) {
            console.log(title('compile') + " " + filename + ".sass");
            if (code.sass.length > 0) {
              sassConf = {
                data: code.sass,
                indentedSyntax: true
              };
              try {
                sassC[commander.compile][file] = sassc.renderSync(sassConf).css.toString('utf8');
              } catch (e$) {
                err = e$;
                console.error(error('err compile sass') + "  " + yellow(err.message));
              }
            } else {
              sassC[commander.compile][file] = "";
            }
          }
          if (commander.javascrypt) {
            code.js = encrypt(code.js);
          }
          save(filename + ".js", code.js);
          return send(code.js);
        };
        return through(write, end);
      });
      browserifyInc(b, {
        cacheFile: compileddir + "/" + file + ".cache"
      });
      bundle = b.bundle();
      string = "";
      bundle.on('data', function(data){
        return string += data.toString();
      });
      bundle.on('error', function(err){
        var ref$;
        return console.log(error('bundle err') + " " + ((ref$ = err.message) != null ? ref$ : err));
      });
      return bundle.on('end', function(_){
        var compiledSass, result;
        compiledSass = sassC[commander.compile];
        result = {
          css: Object.keys(compiledSass).map(function(it){
            return compiledSass[it];
          }).join('\n'),
          js: string
        };
        sassCache.save(sassC);
        callback(null, result);
      });
    };
    if (commander.bundle != null) {
      return makeBundle(file, function(err, bundlec){
        var cssIn, htmlIn, print;
        if (err != null) {
          return cb2(err);
        }
        if (commander.putinhtml == null) {
          save(bundleJs, bundlec.js);
        }
        if (compilesass != null && commander.putinhtml == null) {
          save(bundleCss, bundlec.css);
        }
        cssIn = (function(){
          switch (false) {
          case !commander.putinhtml:
            return "<style>" + bundlec.css + "</style>";
          default:
            return " <link rel=\"stylesheet\" type=\"text/css\" href=\"./" + bundleCss + "\">  ";
          }
        }());
        htmlIn = (function(){
          switch (false) {
          case !commander.putinhtml:
            return "<script>" + bundlec.js + "</script>";
          default:
            return "<script type=\"text/javascript\" src=\"./" + bundleJs + "\"></script>";
          }
        }());
        if (commander.html != null) {
          print = "<!DOCTYPE html>\n<html lang=\"en-us\">\n  <head>\n   <meta charset=\"utf-8\">\n   <title>" + filename + "</title>\n   " + cssIn + "\n  </head>\n  " + htmlIn + "\n</html>";
          save(bundleHtml, print);
        }
        if (commander.nodestart != null) {
          serverStart(commander);
        }
        if (commander.watch) {
          setupWatch(commander);
        }
        cb2(null, "success");
      });
    }
  };
  module.exports = compile;
  function curry$(f, bound){
    var context,
    _curry = function(args) {
      return f.length > 1 ? function(){
        var params = args ? args.concat() : [];
        context = bound ? context || this : this;
        return params.push.apply(params, arguments) <
            f.length && arguments.length ?
          _curry.call(context, params) : f.apply(context, params);
      } : f;
    };
    return _curry();
  }
}).call(this);
