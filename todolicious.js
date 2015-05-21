var configuration = require('./configuration');
var path = require('path');

// Set up express and io
var express = require('express'),
    app = express(),
    http = require('http'),
    server = http.createServer(app).listen(configuration.listenPort),
    io = require('socket.io').listen(server);

app.use('/', express.static(path.join(__dirname, './www')));

io.on('connection', function (socket) {  
});

console.log('Todolicious is starting on port http://localhost:' + configuration.listenPort + '...');
