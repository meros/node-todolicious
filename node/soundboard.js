var async = require('async')
var exec = require('child_process').exec;
var fs = require('fs');
var mustache = require('mustache');
var path = require('path');
var walk = require('walk');

var configuration = require('./configuration');
var imageTypes = [".jpg", ".gif", ".png"];
var htmlTemplate = fs.readFileSync("templates/index.mustache", "utf8");

// Set up express and io
var express = require('express'),
    app = express(),
    http = require('http'),
    server = http.createServer(app).listen(configuration.listenPort),
    io = require('socket.io').listen(server);

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

function getSoundFileNames(done) {
    var files = [];
    var walker = walk.walk(configuration.dataDir, {
        followLinks: false
    });

    walker.on('file', function(root, stat, next) {
        if (stat.name.endsWith(".wav")) {
            files.push(stat.name);
        }

        next();
    });

    walker.on('end', function() {
        done(files);
    });
}

function getFileFullData(file, done) {
    var imgBasePath = configuration.dataDir;
    var imgBaseName = file.replace(/\.[^/.]+$/, "");

    var potentialImageFiles = imageTypes.map(function(type) {
        return imgBaseName + type;
    });


    async.filter(
        potentialImageFiles,
        function(potentialFile, callback) {
            fs.exists(path.join(imgBasePath, potentialFile), callback);
        },
        function(existingImageFiles) {
            result = {
                name: file
            };
            result.imgName = existingImageFiles[0] || '';
            done(null, result);
        }
    )
}

function playFile(file) {
    var command = path.join(__dirname, '/scripts/play.sh') + ' ' + configuration.dataDir + "/" + file;
    exec(command)
}

function getFilesFullData(callback) {
    getSoundFileNames(function(filesNames) {
        async.map(
            filesNames,
            getFileFullData,
            callback);
    });
}

app.get('/', function(req, res) {
    if (!!req.query.id) {
        playFile(req.query.id);
    }

    getFilesFullData(function(error, result) {
        res.send(mustache.to_html(htmlTemplate, {
            pageTitle: configuration.pageTitle,
            files: result
        }));
    });
});

var oneDay = 86400000;

app.use('/data', express.static(configuration.dataDir, { maxAge: oneDay }));
app.use('/', express.static(path.join(__dirname, '../www')));


io.on('connection', function(socket) {    
    getSoundFileNames(function(names) {
        names.forEach(function(name) {
           socket.emit('cache', name); 
        });        
    });
    
    socket.on('play', function(soundfile) {
        console.log("Broadcasting " + soundfile + " to " + io.engine.clientsCount + " clients");
	// Broadcast play command to clients
        io.sockets.emit('play', soundfile);
	// Play on server as well
	playFile(soundfile);
    });
});

console.log('Soundboard is starting on port http://localhost:' + configuration.listenPort + '...');
