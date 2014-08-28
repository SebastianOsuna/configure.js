/**
 * Module dependencies
 */
var fs = require( "fs"),
    path = require( "path" );

/**
 * Configure module definition. You must provide the path to your config files directory.
 * @param configDir Configuration files directory
 * @returns module API. The returned module has 3 functions and 1 property.
 * - __configDir: Absolute path of the given configuration files directory.
 * - handleFile( filename ): Synchronously reads the file with the given filename inside the config directory.
 *                           If file doesn't exists, an exception is thrown.
 *                           The file has to be a json file with .json.dist extension, otherwise an empty configuration
 *                           is returned.
 *                           Finally, a configuration object is returned with the values in the file. The configuration
 *                           object looks like { name: <name>, defaults: <defaults>, values: {} }.
 *                           The <name> is the prefix of the filename (i.e. filename = <name>.json.dist).
 *                           <defaults> are the values in the file.
 *
 * - listConfigFiles():      Returns the list of filenames of all config files in the __configDir directory. A file is
 *                           considered a config file if it has .json.dist extension.
 *
 * - writeFile( config ):    Expects config to be a configuration object. Writes config.values as JSON in a .json file
 *                           with the same name as the configuration object (i.e. <config.name>.json) under the
 *                           __configDir directory. May throw an exception if the directory is readonly or if it
 *                           cannot overwrite an existing .json file.
 *
 */
module.exports = function ( configDir, ignores ) {

    // initialize module
    if ( configDir ) {

        // transform to absolute
        var absolutePath = path.resolve( path.normalize( configDir ) );

        // check if given path is a directory
        if ( !fs.lstatSync( absolutePath ).isDirectory() ) {
            throw "Given directory doesn't exists.";
        }
    } else {
        throw "Undefined config directory.";
    }

    // module exports
    var exports = {};

    // export config dir path
    exports.__configDir = absolutePath;

    // export ignores
    exports.__ignores = ignores || [];

    // export file handling function
    exports.handleFile = function ( filename ) {
        var config = {
                values: {},
                defaults: {}
            };
        if ( _configFilter( filename ) ) {
            var parts = filename.split( "." );

            // config name
            config.name = parts[ parts.length - 3 ];

            // read defaults
            var contents = fs.readFileSync( path.normalize( exports.__configDir + "/" + filename ) );
            try {
                config.defaults = JSON.parse(contents);
            } catch ( e ) {
                throw "JSONFormat Error: error parsing your file. " + e.message;
            }
        }

        return config;
    };

    // export listing function
    exports.listConfigFiles = function () {
        return fs.readdirSync( exports.__configDir).filter( _configFilter );
    };

    // export writing function
    exports.writeFile = function ( config ) {
        fs.writeFileSync( path.normalize( exports.__configDir + "/" + config.name + ".json" ), JSON.stringify( config.values, null, "\t" ) );
    };

    // filename filter function
    function _configFilter ( f ) {
        var parts = f.split("."),
            ext = parts[ parts.length - 1 ],
            pre = parts[ parts.length - 2 ],
            name = parts[ parts.length - 3];

        return !!(ext === "dist" && pre === "json" &&
                    exports.__ignores.indexOf( name ) === -1 && exports.__ignores.indexOf( f ) === -1 );
    }

    return exports;
};
