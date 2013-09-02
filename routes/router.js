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

console.log( JSON5 );

var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;

var dbHost = "localhost",
    dbPort = 27017;

// Create a global database object that we'll connect differently for localhost and
// heroku server, but we'll treat the same otherwise
db = {};


console.log( "WE ARE RUNNING LOCALLY" );

var useLocalDb = true,
    strDBURI = "";

strDBURI = "mongodb://localhost:27017";
console.log( "Using local DB" );

mongo.connect( strDBURI, {}, function(error, _db) {
    if( _db == null ) {
        console.log( "Failed to connect to database" );
        return;
    }

    console.log( "connected to db at " + strDBURI );
    db = _db;

    db.close();
    
    setup( db );
});

function setup( _db ) {
    _db.open( function(err, openedDb) {
        if( !err ) {
            console.log( "Opened db" );
            if( !err ) {

                console.log( "Connected to 'template_db' database" );
                openedDb.collection( 'templates', {safe:true}, function(err, collection) {
                    if( err ) {
                        console.log( "The 'templates' collection doesn't exist. Creating it with sample data..." );
                        //populateDB();
                    }
                });
            } else {
                console.log( "Error authenticating: " + err );
                console.log( "Host: " + dbHost );
                console.log( "Port: " + dbPort );
            }
        } else {
            console.log( "Error opening DB: " + err );
        }    
    });
}

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
    
    while (fs.existsSync(filePath)) {
        filePath = fileRootNameWithBase + '(' + fileID + ').' + fileExtension;
        fileID += 1;
    }
    
    file.contents = file.contents.split(',').pop();
    
    fileBuffer = new Buffer(file.contents, "base64");

    fs.writeFileSync(filePath, fileBuffer);

    // Generate a GUID
    var guid = uuid.v1();

    ares( "python unoconv -f html -o " + __dirname + "/../converted/" + guid + "/index.html " + filePath, true, function() {
        console.log( "Finished converting " + guid );
        res.json( 200, {id:guid} );
    });
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

exports.showContents = function( req, res ) {
    var id = req.params.id;
    var file = req.params.file;
    console.log( "Getting contents " + id + " " + file );

    // Load the html with this id
    var fileContents = fs.readFileSync( "./converted/" + id + "/" + file, {encoding:"utf8"} );

    // Fix any links
//    if( file.split('.').pop().indexOf("html") != -1 ) {
//        fileContents = S( fileContents ).replaceAll('href="', 'href="../contents/' + id + "/").s
//        fileContents = S( fileContents ).replaceAll('src="', 'src="../contents/' + id + "/").s
//    }

    if( fileContents != undefined ) {
        res.writeHead(200, {
            'Content-Type': mime.lookup(file)
        });
        res.write( fileContents );
        res.end();
    } else
        res.json( 500, {'error':'presentation not found'} );

}

// GET /templates
exports.findAll = function( req, res ) {
    // We don't want the browser to cache the results 
    res.header( 'Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0' );

    db.collection( 'templates', function(err, collection) {
        collection.find().toArray(function(err, items) {
            if (err) {
                //console.log('Error getting all templates: ' + err);
                res.json(500, {'error':'An error has occurred!'});
            } else {
                //console.log('Success getting all templates.');
                res.json(200, items);
            }
        });
    });
};

// POST /templates
exports.addTemplate = function( req, res ) {
    
    // We don't want the browser to cache the results 
    res.header( 'Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0' );

    var template = req.body;

    db.collection( 'templates', function(err, collection) {
        collection.insert( template, {safe:true}, function(err, result) {
            if (err) {
                console.log( 'Error adding template: ' + err);
                res.json( 500, {'error':'An error has occurred'} );
            } else {
                console.log( 'Success adding template contents' );
                res.json( 201, result[0] );
            }
        });
    });
}


// POST /contents
exports.addTemplateContents = function( req, res ) {
    
    // We don't want the browser to cache the results 
    res.header( 'Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0' );

    var contents = req.body;

    db.collection( 'contents', function(err, collection) {
        collection.insert( contents, {safe:true}, function(err, result) {
            if( err ) {
                console.log( 'Error adding template contents: ' + err );
                res.json( 500, {'error':'An error has occurred'} );
            } else {
                console.log( 'Success adding template contents: ' + JSON.stringify(result[0]) );
                res.json( 201, result[0] );
            }
        });
    });
}

// DELETE /templates/:id
exports.deleteTemplate = function( req, res ) {

    // We don't want the browser to cache the results 
    res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');

    var id = req.params.id;
    // need to validate the id is in a valid format (24 hex)
    var regexObj = /^[A-Fa-f0-9]{24}$/;

    if (regexObj.test(id)) {
        db.collection('templates', function(err, collection) {
            // Let's see if we find the item before we try to delete it
            collection.find({'_id':new BSON.ObjectID(id)}).toArray(function(err, items) {
                if (err) {
                    // handle error (500)
                    console.log('Error deleting template: ' + err);
                    res.json(500, {'error':'An error has occurred'});
                } else if (items.length != 1) {
                    // item doesn't exist  (or we have bigger issues)
                    console.log('Cannot delete, template not found: ' + id);
                    res.json(404, {'message':'Cannot delete, template not found. ID: ' + id});
                } else {
                    // Remove item
                    collection.remove({'_id':new BSON.ObjectID(id)}, {safe:true}, function(err, result) {
                        if (err) {
                            //console.log('Error deleting template.  ID: ' + id + ' Error: ' + err);
                            res.json(500, {'error':'An error has occurred - ' + err});
                        } else {
                            //console.log('Success deleting template: ' + result + ' document(s) deleted');
                            // HTTP 204 No Content: The server successfully processed the request, but is not returning any content
                            res.json(204);
                        }
                    });
                }
            });
        });
    } else {
        //console.log('Error invalid ID format: ' + id);
        res.json(500, {'error':'invalid ID format'});
    }
}