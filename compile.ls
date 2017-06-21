require! {
    \fs 
    \reactify-ls : \reactify
    \browserify-incremental : \browserifyInc
    \livescript
    \browserify
    \xtend
    \commander
    \node-sass : \sassc
    \node-watch : \watch
}

save = (file, content)->
    console.log "Save #{file}"
    fs.write-file-sync(file, content)

setup-watch = (commander)->
    setup-watch.enabled = yes
    return if setup-watch.$
    setup-watch.$ = yes
    watch do 
        * \./
        * recursive: true,
          filter: (name)->
             !/node_modules/.test(name) and !/\.git/.test(name)
        * ->
             return if setup-watch.enabled is no
             compile commander

compile = (commander)->
    setup-watch.enabled = no
    basedir = process.cwd!
    console.log "Current Directory " + basedir
    file = commander.compile
    return console.error('File is required') if not file?
    target = commander.target ? file
    bundle = if commander.bundle is yes then \bundle else commander.bundle
    html = if commander.html is yes then \index else commander.html
    sass = if commander.sass is yes then \style else commander.sass
    compilesass = if commander.compilesass is yes then \style else commander.compilesass
    input = "#{file}.ls"
    console.log "Compile " + input
    code = reactify fs.read-file-sync(input).to-string(\utf-8)
    js = livescript.compile code.ls
    save "#{target}.js", js
    if sass?
       save "#{sass}.sass", code.sass
    if compilesass?
       console.log "Compile SASS"
       state =
          css: ""
       try 
           state.css = sassc.render-sync do
               data: code.sass
               indented-syntax: yes
           save "#{compilesass}.css", state.css.css
       catch err
           console.error "Compile SASS Error #{err.message ? err}"
    
    make-bundle = (file, callback)->
        options = 
            basedir: basedir
            paths: ["#{basedir}/node_modules"]
            debug: no 
            commondir: no
            entries: [file]
        b = browserify xtend(browserify-inc.args, options)
        browserify-inc b, {cacheFile: file + ".cache"}
        bundle = b.bundle!
        string = ""
        bundle.on \data, (data)->
          string += data.to-string!
        bundle.on \error, (error)->
             #console.error error
        _ <-! bundle.on \end
        callback null, string
    
    if commander.bundle?
        err, bundlec <-! make-bundle "#{target}.js"
        if not err?
           save("#{bundle}.js", bundlec)
        else
           console.error err
    if commander.html?
        print = '''
        <!DOCTYPE html>
        <html lang="en-us">
          <head>
           <meta charset="utf-8">
           <title>Hello...</title>
           <link rel="stylesheet" type="text/css" href="./style.css">
          </head>
          <script type="text/javascript" src="./bundle.js"></script>
        </html>
        '''
        save "#{html}.html", print
    if commander.watch
       setup-watch commander

module.exports = compile