// Look after different browser vendors' ways of calling the getUserMedia()
// API method:
// Opera --> getUserMedia
// Chrome --> webkitGetUserMedia
// Firefox --> mozGetUserMedia
navigator.mediaDevices.getUserMedia = navigator.mediaDevices.getUserMedia || 
    navigator.mediaDevices.webkitGetUserMedia || 
    navigator.mediaDevices.mozGetUserMedia;
// Use constraints to ask for a video-only MediaStream:
var constraints = {audio: false, video: true};
var video = document.querySelector("video");

// Callback to be called in case of success...
function successCallback(stream) {
    // Note: make the returned stream available to console for inspection
    window.stream = stream;
    console.log("stream", stream)

    video.srcObject = stream;
    // We're all set. Let's just play the video out!
    video.play();
}
    
// Callback to be called in case of failures...
function errorCallback(error){
    console.log("navigator.getUserMedia error: ", error);
}
    
// Main action: just call getUserMedia() on the navigator object
navigator.getUserMedia(constraints, successCallback, errorCallback);