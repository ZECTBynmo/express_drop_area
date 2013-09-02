var express = require('express'),
	config = require("./config"),
    path = require('path'),
    http = require('http'),
    io = require('socket.io'),
    LocalTunnel = require('localtunnel-wrapper'),
    router = require('./routes/router');

var app = express();

app.configure( function() {
	app.set( 'port', process.env.PORT || config.port );
    app.use( express.logger('dev') );  /* 'default', 'short', 'tiny', 'dev' */
    app.use( express.bodyParser() ),
    app.use( express.static(path.join(__dirname, 'public')) );
});

app.get( '/presentations/:id', router.showPresentation );
app.get( '/contents/:id/:file', router.showContents );
app.post( '/upload', router.upload );

// Create our server
var server = http.createServer(app).listen(app.get('port'), function () {
    console.log( "Express server listening on port " + app.get('port') );
});

require("connect").createServer( require("connect").static(__dirname) ).listen(2020);