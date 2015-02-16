#!/usr/bin/env node

var path = require( "path" ),
    fs = require( "fs" );
require( "colors" );

/**
 * Command line arguments.
 */
var action = process.argv[2],
    _ask = process.argv.indexOf( "--ask" ) !== -1,
    ignore_index = process.argv.indexOf( "--ignore" ),
    _ignore = ignore_index !== -1,
    _config_path = process.argv.indexOf( "--config" );

// input encoding
process.stdin.setEncoding('utf8');

// handle action
if ( action === "setup") {

    // if --ask flag is given. Typically received after an 'npm install'
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
    process.stdout.write( "Unknown action\r\n".red );
}

/**
 * Writes a question, expects an stdinput response and calls the callback.
 * @param question Text to output.
 * @param callback Callback function. stdinput response given as argument.
 */
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

function readConfigDir( c_path ) {
  try {

      // read ignore flag
      var ignore_list = false;
      if( _ignore ) {
          ignore_list = ( process.argv[ ignore_index + 1 ] ?
              process.argv[ ignore_index + 1 ].split( "," ).map( function ( i ) { return i.trim(); } ) :
              process.argv[ ignore_index + 1 ] );
      }

      // require module
      var configure = require( "../lib/configure" )( c_path, ignore_list );
      var files = configure.listConfigFiles();
      process.stdout.write( ("Found " + files.length + " config file(s).\r\n\r\n").yellow );
      if ( files.length > 0 ) {
          var c = 0,   // current file index
              task = function () {    // file handling function
                  var filename = files[ c ],    // current file
                      config = configure.handleFile(filename);     // current config object

                  // recursive config handling
                  handleConfigEntry(config.defaults, config.values, config.name.green, function () {
                      configure.writeFile(config);     // write file when done
                      c++;
                      if (c < files.length) {
                          task();    // continue with next file
                      } else {
                          process.exit();    // done :)
                      }
                  });
              };
          task();
      } else {
          process.exit();    // nothing to do :(
      }
  } catch ( e ) {

      // invalid directory, probably
      process.stdout.write( ( e.message || e ).red + "\r\n" );
      setup();
  }
}

/**
 * Starts the config files setup process. It first asks for the configuration file directory. It then fetches for all
 * configuration files in the given directory and starts asking for the user values of each entry in each found file.
 */
function setup() {

    // check if config directory is given
    if( _config_path !== -1 ) {

      // get path
      var config_path = path.resolve( process.argv[ _config_path + 1 ] );

      // check if directory exists and is a valid directory
      fs.stat( config_path, function( err, stats ) {
        if( err && err.code === "ENOENT" ) {
          process.stdout.write( "The given directory doesn't exists.\n".red );
        } else if( err ) {

          // unknown error
          process.stdout.write( (err.message + "\n").red );
        } else if( !stats.isDirectory() ) {
          process.stdout.write( "The given config directory is not an actual directory.\n".red );
        } else {
          readConfigDir( config_path );
        }
      } );
      return;
    }

    // ask for config directory
    ask( "Where are your config files? ", function( c_path ) {
        readConfigDir( c_path );
    } );
}

/**
 * Recursive handling of config object. It asks the user for values of the each attribute of the config.defaults object.
 * If the user skips an attribute, the default value is taken.
 * @param defaults Configuration default values.
 * @param values Configuration user given values.
 * @param parent_name Current config object parent name.
 * @param cb Callback function. No arguments given.
 */
function handleConfigEntry ( defaults, values, parent_name, cb ) {
    var entries = Object.keys( defaults ),
        c = 0;

    var cont = function () {    // entry handling function
        if( c < entries.length ) {
            var key = entries[ c ],
                entry = defaults[ key ];
            if ( typeof entry === "string" || typeof entry === "number" || typeof entry === "boolean" || entry == undefined ) {
                ask( ( parent_name ? parent_name + "." + key.blue : key.blue ) + " (" + entry.toString().yellow + "): ", function ( newValue ) {
                    if ( newValue === "" ) {
                        newValue = defaults[ key ];
                    }
                    values[ key ] = newValue;
                    c++;
                    cont();    // continue
                } );
            } else if ( entry instanceof Array ) {    // support for arrays
                var array = values[ key ] = [],
                    _proto = defaults[ key ][ 0 ];
                if ( _proto ) {
                    var array_handler = function ( num ) {
                        num = parseInt( num );
                        if( num ) {    // this makes sure num > 0
                            var cc = -1;
                            var array_item_handler = function () {
                                cc++;
                                if( cc < num ) {
                                    array.push( {} );
                                    var i = array[ array.length - 1 ];
                                    handleConfigEntry( _proto, i,  ( parent_name ? parent_name + "." + key : key ) + "." + cc, array_item_handler );
                                } else {
                                    c++;
                                    cont();    // done with the array
                                }
                            };
                            array_item_handler();    // begin with the array
                        } else {
                            ask( "Number of entries for " + ( parent_name ? parent_name + "." + key.blue : key.blue ) + " ? ", array_handler );
                        }
                    };
                    ask( "Number of entries for " + ( parent_name ? parent_name + "." + key.blue : key.blue ) + " ? ", array_handler );
                } else {
                    c++;
                    cont();
                }
            } else {
                values[ key ] = {};

                // recurse down the object
                handleConfigEntry( defaults[ key ], values[ key ], ( parent_name ? parent_name + "." + key : key ), function () {
                    c++;
                    cont();
                } );
            }
        } else {
            if ( cb ) {
                cb();   // done :)
            }
        }
    };

    // begin
    cont();
}
