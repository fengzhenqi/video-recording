let preview = document.getElementById("preview");
let download = document.getElementById("download");
let startButton = document.getElementById("startButton");
let stopButton = document.getElementById("stopButton");
let recordingTimeMS = 5000;
stopButton.setAttribute('disabled', true);
startButton.addEventListener("click", () => {
    recording(preview, download);
    startButton.setAttribute('disabled', true);
    setTimeout(() => {
        stopButton.removeAttribute('disabled')
        console.log(stopButton.getAttribute('disabled'));
    }, recordingTimeMS);
}, false);
stopButton.addEventListener("click", () => {
    stop(preview.srcObject);
    startButton.removeAttribute('disabled');
    stopButton.setAttribute('disabled', true);
    download.click();
}, false);

/** 获取媒体对象 */
/** 开始录制 */
function recording(videoVm, downloadVm) {
    navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
    })
    .then(stream => {
        videoVm.srcObject = stream;
        downloadVm.href = stream;
        videoVm.captureStream = videoVm.captureStream || videoVm.mozCaptureStream;
        return new Promise(resolve => videoVm.onplaying = resolve);
    })
    .then(() => startRecording(videoVm.captureStream(), recordingTimeMS))
        .then(recordedChunks => {
            // console.log(recordedChunks);
            let recordedBlob = new Blob(recordedChunks, { type: "video/webm" });
            recording.src = URL.createObjectURL(recordedBlob);
            downloadVm.href = recording.src;
            downloadVm.download = "RecordedVideo.webm";
            console.log("Successfully recorded " + recordedBlob.size + " bytes of "
            + recordedBlob.type + " media.");
        })
        .catch(err => console.log(err));
}
/**数据存储处理 */
function startRecording(stream, lengthInMS) {
    let recorder = new MediaRecorder(stream);
    let data = [];

    recorder.ondataavailable = event => data.push(event.data);
    recorder.start();
    let stopped = new Promise((resolve, reject) => {
        recorder.onstop = resolve;
        recorder.onerror = event => reject(event.name);
    });

    let recorded = new Promise(resolve => setTimeout(resolve, lengthInMS))
    .then(
        
        () => recorder.state == "recording" && recorder.stop()
    );

    return Promise.all([
        stopped,
        recorded
    ])
        .then(() => data);
}
/** 终止录制 */
function stop(stream) {
    stream.getTracks().forEach(track => track.stop());
}