// Set us up to use JSON5
require('json5/lib/require');

var mongo = require('mongodb'),
    crypto = require("crypto"),
    networkInterfaces = require("os").networkInterfaces(),
    fs = require("fs"),
    config = require("../config"),
    uuid = require("node-uuid"),
    ares = require("ares").ares,
    JSON5 = require("json5"),
    mime = require("mime"),
    S = require("string");

exports.upload = function( req, res ) {

    var strData = "";

    req.on('data', function(data) {
        console.log( data );
        strData+= data;
    });  

    req.on('end', function() {
        console.log( "SDFSD" );
    });
    
    var file = req.body;

    var fileRootName         = file.name.split('.').shift(),
        fileExtension        = file.name.split('.').pop(),
        filePathBase         = config.upload_dir + '/',
        fileRootNameWithBase = filePathBase + fileRootName,
        filePath             = fileRootNameWithBase + '.' + fileExtension,
        fileID               = 2,
        fileBuffer;

    // If the upload folder doesn't exist already, create it
    if( !fs.existsSync(config.upload_dir) ) {
        fs.mkdirSync( config.upload_dir );
    }
    
    // Make sure we don't overwrite a preexisting upload, and rename it
    // with a (num) if a previous file exists
    while( fs.existsSync(filePath) ) {
        filePath = fileRootNameWithBase + '(' + fileID + ').' + fileExtension;
        fileID += 1;
    }
    
    // Load the file contents and write it to disk in our uploads folder
    file.contents = file.contents.split(',').pop();
    fileBuffer = new Buffer(file.contents, "base64");
    fs.writeFileSync( filePath, fileBuffer );

    res.json( 200, {} );
}


// GET /presentations/:id
exports.showPresentation = function( req, res ) {
    var id = req.params.id;
    console.log( "Getting presentation " + id );

    // Load the html with this id
    var htmlFile = fs.readFileSync( "./converted/" + id + "/index.html", {encoding:"utf8"} );

    console.log( htmlFile );

    // Fix our links
    //htmlFile = S( htmlFile ).replaceAll('href="', 'href="../contents/' + id + "/").s
    //htmlFile = S( htmlFile ).replaceAll('src="', 'src="../contents/' + id + "/").s

    if( htmlFile != undefined ) {
        res.writeHead(200, {
            'Content-Type': 'text/html'
        });
        res.write( htmlFile );
        res.end();
    } else
        res.json( 500, {'error':'presentation not found'} );

}