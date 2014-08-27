#!/usr/bin/env node

var action = process.argv[2],
    _ask = process.argv[3];

process.stdin.setEncoding('utf8');
if ( action === "setup") {
    if( _ask ) {
        var askCallback = function ( answer ) {
            if (answer === "Y" || answer === "y" || answer === "") {
                setup();
            } else if (answer === "N" || answer === "n") {
                process.exit();
            } else {
                ask( "Would you like to setup your config files right now? (Y/n) ", askCallback );
            }
        };
        ask( "Would you like to setup your config files right now? (Y/n) ", askCallback );
    } else {
        setup();
    }
} else {
    process.stdout.write( "Unknown action" );
}

function ask( question, callback ) {
    var stdin = process.stdin,
        stdout = process.stdout;
    stdin.resume();
    stdout.write( question );

    stdin.once( 'data', function ( data ) {
        data = data.toString().trim();
        callback( data );
    } );
}

function setup() {
    ask( "Where are your config files? (relative to " + process.cwd() + ")  ", function( relativePath ) {
        try {
            var configure = require( "../lib/configure" )( relativePath );
            var files = configure.listConfigFiles();
            process.stdout.write( "Found " + files.length + " config file(s).\r\n\r\n" );
            var c = 0,
                task = function () {
                        var filename = files[ c ],
                            config = configure.handleFile(filename);
                        handleConfigEntry(config.defaults, config.values, config.name, function () {
                            configure.writeFile( config );
                            c++;
                            if( c < files.length ) {
                                task();
                            } else{
                                console.log( config )
                                process.exit();
                            }
                        });
                };
                task();
        } catch ( e ) {
            process.stdout.write( e.message + "\r\n" );
            setup();
        }
    } );
}

function handleConfigEntry ( defaults, values, parent_name, cb ) {
    var entries = Object.keys( defaults ),
        c = 0;

    var cont = function () {
        if( c < entries.length ) {
            var key = entries[ c ],
                entry = defaults[ key ];
            if (typeof entry === "string" || typeof entry === "number" || typeof entry === "boolean" || entry == undefined) {
                ask(( parent_name ? parent_name + "." + key : key ) + " (" + entry + "): ", function (newValue) {
                    if (newValue === "") {
                        newValue = defaults[ key ];
                    }
                    values[ key ] = newValue;
                    c++; cont();
                });
            } else {
                values[ key ] = {};

                handleConfigEntry(defaults[ key ], values[ key ], ( parent_name ? parent_name + "." + key : key ), function () {
                    c++; cont();
                } );
            }
        } else {
            if ( cb ) { cb(); }
        }
    };

    cont();


}