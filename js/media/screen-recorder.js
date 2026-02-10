import { Utils } from '../utils/common.js';

document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('preview-video');
    const btnStart = document.getElementById('btn-start');
    const btnStop = document.getElementById('btn-stop');
    const btnDownload = document.getElementById('btn-download');
    const recIndicator = document.getElementById('rec-indicator');
    const timerDisplay = document.getElementById('timer');
    const placeholder = document.getElementById('placeholder');

    const chkAudio = document.getElementById('chk-audio');
    const chkSysAudio = document.getElementById('chk-sys-audio');

    let mediaRecorder;
    let recordedChunks = [];
    let stream;
    let startTime;
    let timerInterval;

    btnStart.addEventListener('click', async () => {
        try {
            const displayMediaOptions = {
                video: {
                    cursor: "always"
                },
                audio: chkSysAudio.checked
            };

            // Get Screen Stream
            let screenStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);

            // If Mic audio requested, get it and merge
            if (chkAudio.checked) {
                const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

                // Merge tracks
                const tracks = [
                    ...screenStream.getVideoTracks(),
                    ...screenStream.getAudioTracks(), // System audio
                    ...micStream.getAudioTracks()     // Mic audio
                ];
                stream = new MediaStream(tracks);
            } else {
                stream = screenStream;
            }

            // Setup Video Preview
            video.srcObject = stream;
            placeholder.style.display = 'none';

            // Setup Recorder
            const mimeType = MediaRecorder.isTypeSupported("video/webm; codecs=vp9")
                ? "video/webm; codecs=vp9"
                : "video/webm";

            mediaRecorder = new MediaRecorder(stream, { mimeType });

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                stopRecordingLogic();
            };

            // Handle user clicking "Stop Sharing" native browser button
            stream.getVideoTracks()[0].onended = () => {
                if (mediaRecorder.state !== 'inactive') {
                    stopRecording();
                }
            };

            // Start Recording
            recordedChunks = [];
            mediaRecorder.start();
            startTimer();

            // UI Update
            recIndicator.style.display = 'flex';
            btnStart.disabled = true;
            btnStop.disabled = false;
            btnDownload.disabled = true;

        } catch (err) {
            console.error("Error: " + err);
            Utils.showToast("Could not start recording: " + err.message, "error");
        }
    });

    btnStop.addEventListener('click', stopRecording);

    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }

        // Stop all tracks to release camera/screen
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    }

    function stopRecordingLogic() {
        stopTimer();
        recIndicator.style.display = 'none';

        btnStart.disabled = false;
        btnStop.disabled = true;
        btnDownload.disabled = false;

        const blob = new Blob(recordedChunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);

        // Update video to show recorded content instead of live stream (which is ended)
        video.srcObject = null;
        video.src = url;
        video.controls = true;
        video.muted = false; // Unmute so user can hear playback

        btnDownload.onclick = () => {
            const filename = `recording_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.webm`;
            Utils.downloadBlob(blob, filename);
        };

        Utils.showToast("Recording finished! You can now review or download.", "success");
    }

    // Timer Logic
    function startTimer() {
        startTime = Date.now();
        timerInterval = setInterval(() => {
            const diff = Date.now() - startTime;
            const sec = Math.floor((diff / 1000) % 60);
            const min = Math.floor((diff / (1000 * 60)) % 60);
            timerDisplay.textContent = `${pad(min)}:${pad(sec)}`;
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
        timerDisplay.textContent = "00:00";
    }

    function pad(n) {
        return n < 10 ? '0' + n : n;
    }
});
