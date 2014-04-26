var express = require('express');
var user = require('./routes/user');
var talks = require('./routes/talks');
var http = require('http');
var path = require('path');
var methodOverride = require('method-override');
var bodyParser = require('body-parser');
var staticFavicon = require('static-favicon');
var errorHandler = require('errorhandler');
var morgan = require('morgan');
var socketIO = require('socket.io');
var compression = require('compression');

var configuration = require('./configuration');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);

app.use(compression());
app.use(staticFavicon());
app.use(morgan('dev'));
app.use(bodyParser());
app.use(methodOverride());

var staticFile = function(path){
    return function(req, res, next) {
        if ('GET' != req.method && 'HEAD' != req.method) {
            return next();
        }

        res.sendfile(path);
    };
};

app.get('/users', user.list);
app.get('/api/talks/current', talks.list);

var env = process.env.NODE_ENV || 'development';
if ('development' == env) {
    app.use(errorHandler());

    app.use(express.static(path.join(__dirname, 'public')));

    var externalLibs = configuration.externalLibs;
    for(var name in externalLibs){
        app.use('/javascripts/' + name + '.js', staticFile(externalLibs[name]));
    }
} else {
    app.use(express.static(path.join(__dirname, 'publicBuild')));
}


var server = http.createServer(app);
socketIO = socketIO.listen(server);
server.listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});

socketIO.sockets.on('connection', function (socket) {
    socket.emit('news', { hello: 'world' });
    socket.on('my other event', function (data) {
        console.log(data);
    });
});