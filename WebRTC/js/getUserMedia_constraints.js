// Define local variables associated with video resolution selection
// buttons in the HTML page
var vgaButton = document.querySelector("button#vga");
var qvgaButton = document.querySelector("button#qvga");
var hdButton = document.querySelector("button#hd");
// Video element in the HTML5 page
var video = document.querySelector("video");
// The local MediaStream to play with
// var stream;
// Look after different browser vendors' ways of calling the
// getUserMedia() API method:
navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
// Callback to be called in case of success...
function successCallback(gotStream) {
    // Make the stream available to the console for introspection
    window.stream = gotStream;
    // Attach the returned stream to the <video> element
    // in the HTML page
    video.srcObject = gotStream;
    // Start playing video
    video.play();
    // Callback to be called in case of failure...
    function errorCallback(error) {
        console.log("navigator.getUserMedia error: ", error);
    }
}
// Constraints object for low resolution video
var qvgaConstraints = {
    video: {
        mandatory: {
            maxWidth: 320,
            maxHeight: 240
        }
    }
};
// Constraints object for standard resolution video
var vgaConstraints = {
    video: {
        mandatory: {
            maxWidth: 640,
            maxHeight: 480
        }
    }
};
// Constraints object for high resolution video
var hdConstraints = {
    video: {
        mandatory: {
            minWidth: 1280,
            minHeight: 960
        }
    }
};
// Associate actions with buttons:
qvgaButton.onclick = function () { getMedia(qvgaConstraints) };
vgaButton.onclick = function () { getMedia(vgaConstraints) };
hdButton.onclick = function () { getMedia(hdConstraints) };

// Callback to be called in case of failures...
function errorCallback(error){
    console.log("navigator.getUserMedia error: ", error);
}

// Simple wrapper for getUserMedia() with constraints object as
// an input parameter
function getMedia(constraints) {
    if (window.stream) {
        video.src = null;
        window.stream.getTracks().forEach(track => {
            track.stop();
        });
    }
    navigator.getUserMedia(constraints, successCallback, errorCallback);
}