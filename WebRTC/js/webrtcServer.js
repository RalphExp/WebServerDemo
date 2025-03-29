var static = require('node-static');
var https = require('https');
var fs = require('fs')

// Create a node-static server instance listening on port 8181
var file = new (static.Server)();

const options = {
  key: fs.readFileSync('../key.pem'),
  cert: fs.readFileSync('../cert.pem')
};

// We use the http module’s createServer function and
// use our instance of node-static to serve the files
const server = https.createServer(options, function (req, res) {
    file.serve(req, res);
})

// Use socket.io JavaScript library for real-time web applications
const io = require('socket.io')(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "HEAD", "PATCH", "OPTIONS", "TRACE"],
        allowedHeaders: "*",
        credentials: false
    }
});

// Let's start managing connections...
io.on('connection', function (socket) {
    console.log('accepted new client:')
    // Handle 'message' messages
    socket.on('message', function (msg) {
        log('S --> Got message: ', msg.message);
        console.log('[message]', msg);
        socket.broadcast.to(msg.channel).emit('message', msg.message);
    });
    // Handle 'create or join' messages
    socket.on('create or join', function (channel) {
        io.sockets.in(channel).fetchSockets()
            .then(sockets => {
                var numClients = sockets.length;
                console.log('numclients = ' + numClients);
                log('S --> Room ' + channel + ' has ' + numClients + ' client(s)');
                log('S --> Request to create or join room', channel);
                // First client joining...
                if (numClients == 0) {
                    socket.join(channel);
                    socket.emit('created', channel);
                } else if (numClients == 1) {
                    // Second client joining...
                    io.sockets.in(channel).emit('join', channel);
                    socket.join(channel);
                    socket.emit('joined', channel);
                } else { // max two clients
                    socket.emit('full', channel);
                }
            })
            .catch(error => {
                console.error('Error fetching sockets:', error);
            });
    });

    // Handle 'response' messages
    socket.on('response', function (response) {
        log('S --> Got response: ', response);
        // Just forward message to the other peer
        socket.broadcast.to(response).emit('response', response);
    });
    // Handle 'Bye' messages
    socket.on('Bye', function (channel) {
        // Notify other peer
        socket.broadcast.to(channel).emit('Bye');
        // Close socket from server's side
        socket.disconnect();
    });
    // Handle 'Ack' messages
    socket.on('Ack', function () {
        console.log('Got an Ack!');
        // Close socket from server's side
        socket.disconnect();
    });
    // Utility function used for remote logging
    function log() {
        var array = [">>> "];
        for (var i = 0; i < arguments.length; i++) {
            array.push(arguments[i]);
        }
        socket.emit('log', array);
    }
});

console.log('listening port:',8181)
server.listen(8181);
