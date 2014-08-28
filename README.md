configure.js
===

Share and manage your config file without distributing your data.

Inspired in Symfony, configure.js lets you create config files based on distributable templates.

configure.js only supports JSON config files. YML support on the way.

## How does it work?

Call `configure setup` to begin the process.
 
configure.js will look for all `*.json.dist` files on the provided directory and use them as templates to create your
configuration files. The values provided in the `*.json.dist` files will be used as default.

After the setup process is completed you can use the `*.json` files inside you application as normal.

You can also skip files, but be sure to provide them before running your app.

```
$ configure setup --ignore "ignore_this, this_also_works.json.dist"
```

Finally, don't forget to add `config/dir/*.json` to your `.gitignore` so you only distribute `.json.dist` templates over
source control.

# Warning: 
**configure.js will overwrite  `<file_name>.json`  if  `<file_name>.json.dist`  is being setup.**

## Furute work

- YAML support
- gh-pages (?)
- Support functions (Whenever I need it or someone PR's)