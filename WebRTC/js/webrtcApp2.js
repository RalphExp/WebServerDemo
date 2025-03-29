'use strict';
// Look after different browser vendors' ways of calling the getUserMedia()
// API method:
// Opera --> getUserMedia
// Chrome --> webkitGetUserMedia
// Firefox --> mozGetUserMedia

navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
// Clean-up function:
// collect garbage before unloading browser's window
window.onbeforeunload = function (e) {
    hangup();
}
// Data channel information
var sendChannel, receiveChannel;
var sendButton = document.getElementById("sendButton");
var sendTextarea = document.getElementById("dataChannelSend");
var receiveTextarea = document.getElementById("dataChannelReceive");
// HTML5 <video> elements
var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');
// Handler associated with Send button
sendButton.onclick = sendData;
// Flags...
var isChannelReady = false;
var isInitiator = false;
var isStarted = false;
// WebRTC data structures
// Streams
var localStream;
var remoteStream;
// PeerConnection
var pc;

var webrtcDetectedBrowser;

if (navigator.mozGetUserMedia) {
    webrtcDetectedBrowser = 'firefox';  // Firefox
} else if (navigator.webkitGetUserMedia) {
    webrtcDetectedBrowser = 'chrome';  // Chrome (including Chromium)
} else if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    webrtcDetectedBrowser = 'edge';    // Edge
} else {
    webrtcDetectedBrowser = 'unknown'; // Unknown browser
}

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

// PeerConnection ICE protocol configuration (either Firefox or Chrome)
var pc_config = webrtcDetectedBrowser === 'firefox' ?
    { 'iceServers': [{ 'url': 'stun:23.21.150.121' }] } : // IP address
    { 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }] };
var pc_constraints = {
    'optional': [
        { 'DtlsSrtpKeyAgreement': true }
    ]
};
var sdpConstraints = {};
// Connect to signaling server
var socket = new WebSocket("wss://localhost:9449");
// Set getUserMedia constraints
var constraints = { video: true, audio: true };

// From this point on, execution proceeds based on asynchronous events...
// getUserMedia() handlers...
function handleUserMedia(stream) {
    localStream = stream;
    // attachMediaStream(localVideo, stream);
    localVideo.srcObject = stream;
    console.log('Adding local stream.');
    // sendMessage('got user media');

    // TODO: the best way is to send back a message to notify the 
    // initializer we're ready
    if (!isInitiator) {
        checkAndStart()
    }
}

function trace(msg) {
    console.log('[trace]:', msg)
}

function onSignalingError(error) {
    console.log('Failed to create signaling message : ' + error.name);
}

function handleUserMediaError(error) {
    console.log('navigator.getUserMedia error: ', error);
}

// Server-mediated message exchanging...
// Receive message from the other peer via the signaling server
socket.addEventListener('message', async function (message) {
    console.log('[message]', message);
    if (message.data === 'created') {
        console.log('[created]');
        isInitiator = true;
        navigator.getUserMedia(constraints, handleUserMedia, handleUserMediaError);
    } else if (message.data == 'joined') {
        if (!isInitiator) {
            navigator.getUserMedia(constraints, handleUserMedia, handleUserMediaError);
        } else {
            // master create pipeline
            await sleep(500)
            checkAndStart();
        }
    } else if (message.data === 'playerDisconnected') {
        if (!isInitiator)
            handleRemoteHangup();
    } else {
        // SDP message
        message = JSON.parse(message.data)
        if (message.type === 'offer') {
            if (!isInitiator && !isStarted) {
                checkAndStart();
            }
            pc.setRemoteDescription(new RTCSessionDescription(message));
            doAnswer();
        } else if (message.type === 'answer' && isStarted) {
            pc.setRemoteDescription(new RTCSessionDescription(message));
        } else if (message.type === 'candidate' && isStarted) {
            var candidate = new RTCIceCandidate({
                sdpMLineIndex: message.label,
                candidate: message.candidate
            });
            pc.addIceCandidate(candidate);
        }
    }
});
// 2. Client-->Server
// Send message to the other peer via the signaling server
function sendMessage(message) {
    console.log('Sending message: ', message);
    if (message instanceof Object) {
        socket.send(JSON.stringify(message))
    } else {
        socket.send(message)
    }
}
// Channel negotiation trigger function
function checkAndStart() {
    console.log('checking:', isStarted, localStream)
    if (!isStarted && typeof localStream != 'undefined') {
        console.log('creating peer connection')
        createPeerConnection();
        isStarted = true;
        if (isInitiator) {
            console.log('start to call')
            doCall();
        }
    }
}
// PeerConnection management...
function createPeerConnection() {
    try {
        pc = new RTCPeerConnection(pc_config, pc_constraints);
        pc.addStream(localStream);
        pc.onicecandidate = handleIceCandidate;
        console.log('Created RTCPeerConnnection with:\n' +
            ' config: \'' + JSON.stringify(pc_config) + '\';\n' +
            ' constraints: \'' + JSON.stringify(pc_constraints) + '\'.');
    } catch (e) {
        console.log('Failed to create PeerConnection, exception: ' + e.message);
        alert('Cannot create RTCPeerConnection object.');
        return;
    }
    pc.onaddstream = handleRemoteStreamAdded;
    pc.onremovestream = handleRemoteStreamRemoved;
    if (isInitiator) {
        try {
            // Create a reliable data channel
            sendChannel = pc.createDataChannel("sendDataChannel",
                { reliable: true });
            trace('Created send data channel');
        } catch (e) {
            alert('Failed to create data channel. ');
            trace('createDataChannel() failed with exception: ' + e.message);
        }
        sendChannel.onopen = handleSendChannelStateChange;
        sendChannel.onmessage = handleMessage;
        sendChannel.onclose = handleSendChannelStateChange;
    } else { // Joiner
        pc.ondatachannel = gotReceiveChannel;
    }
}
// Data channel management
function sendData() {
    var data = sendTextarea.value;
    if (isInitiator) sendChannel.send(data);
    else receiveChannel.send(data);
    trace('Sent data: ' + data);
}
// Handlers...
function gotReceiveChannel(event) {
    trace('Receive Channel Callback');
    receiveChannel = event.channel;
    receiveChannel.onmessage = handleMessage;
    receiveChannel.onopen = handleReceiveChannelStateChange;
    receiveChannel.onclose = handleReceiveChannelStateChange;
}
function handleMessage(event) {
    trace('Received message: ' + event.data);
    receiveTextarea.value += event.data + '\n';
}
function handleSendChannelStateChange() {
    var readyState = sendChannel.readyState;
    trace('Send channel state is: ' + readyState);
    // If channel ready, enable user's input
    if (readyState == "open") {
        dataChannelSend.disabled = false;
        dataChannelSend.focus();
        dataChannelSend.placeholder =
            "";
        sendButton.disabled = false;
    } else {
        dataChannelSend.disabled = true;
        sendButton.disabled = true;
    }
}
function handleReceiveChannelStateChange() {
    var readyState = receiveChannel.readyState;
    trace('Receive channel state is: ' + readyState);
    // If channel ready, enable user's input
    if (readyState == "open") {
        dataChannelSend.disabled = false;
        dataChannelSend.focus();
        dataChannelSend.placeholder =
            "";
        sendButton.disabled = false;
    } else {
        dataChannelSend.disabled = true;
        sendButton.disabled = true;
    }
}
// ICE candidates management
function handleIceCandidate(event) {
    console.log('handleIceCandidate event: ', event);
    if (event.candidate) {
        sendMessage({
            type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate
        });
    } else {
        console.log('End of candidates.');
    }
}
// Create Offer
function doCall() {
    console.log('Creating Offer...');
    pc.createOffer(setLocalAndSendMessage, onSignalingError, sdpConstraints);
    // Signaling error handler
    function onSignalingError(error) {
        console.log('Failed to create signaling message : ' + error.name);
    }
}
// Create Answer
function doAnswer() {
    console.log('Sending answer to peer.');
    pc.createAnswer(setLocalAndSendMessage, onSignalingError, sdpConstraints);
}
// Success handler for both createOffer()
// and createAnswer()
function setLocalAndSendMessage(sessionDescription) {
    pc.setLocalDescription(sessionDescription);
    console.log('[setLocalAndSendMessage], desc=', sessionDescription)

    // this is a description message: type = offer|answer
    sendMessage(sessionDescription);
}
// Remote stream handlers...
function handleRemoteStreamAdded(event) {
    console.log('Remote stream added.');
    // attachMediaStream(remoteVideo, event.stream);
    remoteVideo.srcObject = event.stream;
    console.log('Remote stream attached!!.');
    remoteStream = event.stream;
}
function handleRemoteStreamRemoved(event) {
    console.log('Remote stream removed. Event: ', event);
}
// Clean-up functions...
function hangup() {
    console.log('Hanging up.');
    stop();
    sendMessage('playerDisconnected');
}
function handleRemoteHangup() {
    console.log('Session terminated.');
    stop();
    isInitiator = false;
}
function stop() {
    isStarted = false;
    if (sendChannel) sendChannel.close();
    if (receiveChannel) receiveChannel.close();
    if (pc) pc.close();
    pc = null;
    sendButton.disabled = true;
}
