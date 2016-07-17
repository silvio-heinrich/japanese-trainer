
function Audio() {
    var context = new (window.AudioContext || window.webkitAudioContext)();
    var data    = [];

    function errorHandler(e) {
        console.log("audio error: " + e);
    }

    this.loadFile = function(fileURL, fileID, onload) {
        if(data[fileID] != undefined && data[fileID].url === fileURL) {
            onload(fileURL, fileID);
            return;
        }
        var request = new XMLHttpRequest();
        request.open("get", fileURL, true);
        request.responseType = "arraybuffer";
        request.onload       = function() {
            if(request.status == 404) {
                console.log("http error: 404 file not found");
                return;
            }
            context.decodeAudioData(request.response, function(audioBuffer) {
                data[fileID] = {
                    id:     fileID,
                    url:    fileURL,
                    buffer: audioBuffer,
                    node:   null
                };
                onload(fileURL, fileID);
            }, errorHandler);
        }
        request.send();
    }
    this.play = function(id) {
        var d = data[id];

        if(d === undefined) {
            return;
        }
        var source = context.createBufferSource();
        data[id].node = source;
        source.buffer = d.buffer;
        source.connect(context.destination);
        source.start(0);
    }
    this.stop = function(id) {
        var d = data[id];

        if(d.node != null) {
            d.node.stop();
        }
    }
}
