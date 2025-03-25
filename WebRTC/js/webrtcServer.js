var static = require('node-static');
var http = require('http');
// Create a node-static server instance listening on port 8181
var file = new (static.Server)();

// We use the http module’s createServer function and
// use our instance of node-static to serve the files
const server = http.createServer(function (req, res) {
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
    // Handle 'message' messages
    socket.on('message', function (message) {
        log('S --> Got message: ', message);
        socket.broadcast.to(message.channel).emit('message', message.message);
    });
    // Handle 'create or join' messages
    socket.on('create or join', function (room) {
        io.sockets.in(room).fetchSockets()
            .then(sockets => {
                var numClients = sockets.length;
                console.log('numclients = ' + numClients);
                log('S --> Room ' + room + ' has ' + numClients + ' client(s)');
                log('S --> Request to create or join room', room);
                // First client joining...
                if (numClients == 0) {
                    socket.join(room);
                    socket.emit('created', room);
                } else if (numClients == 1) {
                    // Second client joining...
                    io.sockets.in(room).emit('join', room);
                    socket.join(room);
                    socket.emit('joined', room);
                } else { // max two clients
                    socket.emit('full', room);
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
        socket.broadcast.to(response.channel).emit('response',
            response.message);
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

server.listen(8181);