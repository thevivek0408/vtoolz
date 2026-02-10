import { Utils } from '../utils/common.js';

document.addEventListener('DOMContentLoaded', () => {
    const btnRecord = document.getElementById('btn-record');
    const btnStop = document.getElementById('btn-stop');
    const timerDisplay = document.getElementById('timer');
    const statusText = document.getElementById('status-text');
    const visualizer = document.getElementById('visualizer');
    const audioOutput = document.getElementById('audio-output');
    const downloadLink = document.getElementById('download-link');

    let mediaRecorder;
    let audioChunks = [];
    let startTime;
    let timerInterval;
    let audioContext;
    let analyser;
    let dataArray;
    let canvasCtx = visualizer.getContext('2d');
    let animationId;

    // Check Support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        statusText.textContent = "Error: Audio recording not supported in this browser.";
        statusText.style.color = "var(--danger-color)";
        btnRecord.disabled = true;
        return;
    }

    // Canvas Setup
    function resizeCanvas() {
        visualizer.width = visualizer.offsetWidth;
        visualizer.height = visualizer.offsetHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Start Recording
    btnRecord.addEventListener('click', async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Setup Audio Context for Visualizer
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(stream);
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            dataArray = new Uint8Array(analyser.frequencyBinCount);

            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();

            startTime = Date.now();
            timerInterval = setInterval(updateTimer, 1000);
            visualize();

            // UI Updates
            btnRecord.disabled = true;
            btnRecord.classList.add('recording');
            btnStop.disabled = false;
            statusText.textContent = "Recording...";
            audioOutput.style.display = 'none';
            downloadLink.style.display = 'none';
            audioChunks = [];

            mediaRecorder.ondataavailable = (e) => {
                audioChunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
                clearInterval(timerInterval);
                cancelAnimationFrame(animationId);
                btnRecord.classList.remove('recording');
                btnRecord.disabled = false;
                btnStop.disabled = true;
                statusText.textContent = "Recording saved.";

                // Create Blob
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);

                // Playback
                audioOutput.src = audioUrl;
                audioOutput.style.display = 'block';

                // Download Link
                downloadLink.href = audioUrl;
                downloadLink.download = `Recording_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
                downloadLink.style.display = 'inline-block';
                downloadLink.textContent = "Download .WEBM";

                // Stop inputs
                stream.getTracks().forEach(track => track.stop());
                if (audioContext && audioContext.state !== 'closed') {
                    audioContext.close();
                }
            };

        } catch (err) {
            console.error(err);
            Utils.showToast("Could not access microphone: " + err.message, "error");
        }
    });

    // Stop Recording
    btnStop.addEventListener('click', () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
    });

    function updateTimer() {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const min = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const sec = String(elapsed % 60).padStart(2, '0');
        timerDisplay.textContent = `${min}:${sec}`;
    }

    function visualize() {
        animationId = requestAnimationFrame(visualize);
        analyser.getByteFrequencyData(dataArray);

        canvasCtx.fillStyle = '#000';
        canvasCtx.fillRect(0, 0, visualizer.width, visualizer.height);

        const barWidth = (visualizer.width / dataArray.length) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
            barHeight = dataArray[i] / 2;

            canvasCtx.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
            canvasCtx.fillRect(x, visualizer.height - barHeight, barWidth, barHeight);

            x += barWidth + 1;
        }
    }
});
