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
        socket.broadcast.to(message.channel).emit('message', message);
    });
    // Handle 'create or join' messages
    socket.on('create or join', function (channel) {
        io.sockets.in(channel).fetchSockets()
            .then(sockets => {
                var numClients = sockets.length;
                console.log('numclients = ' + numClients);
                if (numClients == 0) {
                    socket.join(channel);
                    socket.emit('created', channel);
                } else if (numClients == 1) {
                    // server get 'create or join'
                    // then broadcast the message, so the initiator will receive this message
                    io.sockets.in(channel).emit('remotePeerJoining', channel);
                    socket.join(channel);
                    socket.broadcast.to(channel).emit('broadcast: joined', 'S --> broadcast(): client ' + socket.id + ' joined channel ' + channel);
                } else {
                    console.log("Channel full!");
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