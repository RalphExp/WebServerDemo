'use strict'

const port = process.env.PORT || 9449

let connections = {}
let connectionSize = 0;
let index = 0

const express = require('express')
const cors = require('cors')
const https = require('https')
const fs = require('fs');
const app = express()

const options = {
    key: fs.readFileSync('../../certs/key.pem'),
    cert: fs.readFileSync('../../certs/cert.pem')
}

const server = https.createServer(options, app)
const expressWs = require('express-ws')(app, server);

app.use(cors());

app.ws('/', function (ws, req) {
    let connectionId = 'conn_' + (index++)
    connections[connectionId] = ws
    connectionSize++;
    console.log('ws connect[' + connectionId + '] total = ', connectionSize);

    function send(message) {
        console.log('sending message:', message)
        ws.send(message)
    }

    function broadcast(message) {
        console.log('broadcasting message:', message)

        for (let key in connections) {
            if (key != connectionId) {
                try {
                    let _ws = connections[key]
                    if (_ws) {
                        _ws.send(message)
                    }
                } catch (e) {
                    console.log('websocket.send() error.', e)
                }
            }
        }
    }

    ws.on('message', function (message) {
        broadcast(message)
    });

    ws.on('close', function () {
        broadcast("playerDisconnected")
        delete connections[connectionId]
        --connectionSize;
    });

    if (connectionSize == 1) {
        send('created')
    } else if (connectionSize == 2) {
        send("joined") // send to both side
        broadcast("joined")
    } else {
        console.log('the room is full')
        ws.close();
    }
});

// app.listen(port, () => console.log('Listening on port ' + port + '...'))
server.listen(port, () => {
    console.log('Listening on port ' + port + '...')
})
