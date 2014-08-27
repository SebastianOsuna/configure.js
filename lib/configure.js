var fs = require( "fs"),
    path = require( "path" );

module.exports = function ( configDir ) {
    // Initialize
    if ( configDir ) {
        var absolutePath = path.resolve( path.normalize( configDir ) );
        if ( !fs.lstatSync( absolutePath ).isDirectory() ) {
            throw "Given directory doesn't exists.";
        }
    } else {
        throw "Undefined config directory.";
    }

    var exports = {};
    exports.__configDir = absolutePath;
    exports.handleFile = function ( filename ) {
        var parts = filename.split("."),
            ext = parts[ parts.length - 1 ],
            pre = parts[ parts.length - 2 ],
            config = {
                values: {},
                defaults: {}
            };
        if ( ext === "dist" && pre === "json" ) {
            config.name = parts[ parts.length - 3 ];

            var contents = fs.readFileSync( path.normalize( exports.__configDir + "/" + filename ) );
            config.defaults = JSON.parse( contents );
        }

        return config;
    };
    exports.listConfigFiles = function () {
        return fs.readdirSync( exports.__configDir).filter( function ( f ) {
            var parts = f.split("."),
                ext = parts[ parts.length - 1 ],
                pre = parts[ parts.length - 2 ];

            return !!(ext === "dist" && pre === "json");
        } );
    };
    exports.writeFile = function ( config ) {
        fs.writeFileSync( path.normalize( exports.__configDir + "/" + config.name + ".json" ), JSON.stringify( config.values, null, "\t" ) );
    };

    return exports;
};
