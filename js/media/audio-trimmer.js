import { Utils } from '../utils/common.js';

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    const uploadArea = document.getElementById('upload-area');
    const editorArea = document.getElementById('editor-area');
    const fileNameDisplay = document.getElementById('file-name');
    const audioPreview = document.getElementById('audio-preview');
    const startTimeInput = document.getElementById('start-time');
    const endTimeInput = document.getElementById('end-time');
    const btnPlaySegment = document.getElementById('btn-play-segment');
    const btnTrim = document.getElementById('btn-trim');

    let audioContext;
    let audioBuffer;
    let originalFile;

    window.openAudioTrimmerPicker = () => {
        fileInput.click();
    };

    // Handle File Upload
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) loadFile(e.target.files[0]);
    });

    // Drag and Drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--primary-color)';
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = 'var(--border-color)';
    });
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--border-color)';
        if (e.dataTransfer.files.length) loadFile(e.dataTransfer.files[0]);
    });

    async function loadFile(file) {
        if (!file.type.startsWith('audio/')) {
            Utils.showToast("Please upload an audio file.", "error");
            return;
        }

        Utils.showToast("Loading audio...", "info");
        originalFile = file;
        fileNameDisplay.textContent = file.name;

        // Load Audio Context
        audioContext = new (window.AudioContext || window.webkitAudioContext)();

        try {
            const arrayBuffer = await file.arrayBuffer();
            audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            // Set up editor
            uploadArea.style.display = 'none';
            editorArea.style.display = 'block';

            // Set URL for full preview
            audioPreview.src = URL.createObjectURL(file);

            // Init inputs
            startTimeInput.value = 0;
            endTimeInput.value = audioBuffer.duration.toFixed(2);
            endTimeInput.max = audioBuffer.duration;
            startTimeInput.max = audioBuffer.duration;

        } catch (err) {
            console.error(err);
            Utils.showToast("Error decoding audio: " + err.message, "error");
        }
    }

    // Play Segment
    btnPlaySegment.addEventListener('click', () => {
        if (!audioBuffer) return;

        const start = parseFloat(startTimeInput.value);
        const end = parseFloat(endTimeInput.value);

        if (start >= end) {
            Utils.showToast("Start time must be before end time.", "warning");
            return;
        }

        const duration = end - start;

        // Create a buffer source
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start(0, start, duration);
    });

    // Trim & Download
    btnTrim.addEventListener('click', () => {
        if (!audioBuffer) return;

        const start = parseFloat(startTimeInput.value);
        const end = parseFloat(endTimeInput.value);

        if (start >= end) {
            Utils.showToast("Invalid time range.", "error");
            return;
        }

        Utils.showToast("Trimming...", "info");

        // Create new buffer
        const sampleRate = audioBuffer.sampleRate;
        const startFrame = Math.floor(start * sampleRate);
        const endFrame = Math.floor(end * sampleRate);
        const frameCount = endFrame - startFrame;

        const newBuffer = audioContext.createBuffer(
            audioBuffer.numberOfChannels,
            frameCount,
            sampleRate
        );

        for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
            const channelData = audioBuffer.getChannelData(i);
            const newChannelData = newBuffer.getChannelData(i);
            // Copy data
            for (let j = 0; j < frameCount; j++) {
                newChannelData[j] = channelData[startFrame + j];
            }
        }

        // Encode to WAV
        const wavBlob = bufferToWav(newBuffer);
        Utils.downloadBlob(wavBlob, `trimmed_${originalFile.name.split('.')[0]}.wav`);
        Utils.showToast("Downloaded!", "success");
    });

    // Simple WAV Encoder
    function bufferToWav(abuffer) {
        const numOfChan = abuffer.numberOfChannels;
        const length = abuffer.length * numOfChan * 2 + 44;
        const buffer = new ArrayBuffer(length);
        const view = new DataView(buffer);
        const channels = [];
        let i;
        let sample;
        let offset = 0;
        let pos = 0;

        // write WAVE header
        setUint32(0x46464952);                         // "RIFF"
        setUint32(length - 8);                         // file length - 8
        setUint32(0x45564157);                         // "WAVE"

        setUint32(0x20746d66);                         // "fmt " chunk
        setUint32(16);                                 // length = 16
        setUint16(1);                                  // PCM (uncompressed)
        setUint16(numOfChan);
        setUint32(abuffer.sampleRate);
        setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
        setUint16(numOfChan * 2);                      // block-align
        setUint16(16);                                 // 16-bit (hardcoded in this encoder)

        setUint32(0x61746164);                         // "data" - chunk
        setUint32(length - pos - 4);                   // chunk length

        // write interleaved data
        for (i = 0; i < abuffer.numberOfChannels; i++)
            channels.push(abuffer.getChannelData(i));

        while (pos < length) {
            for (i = 0; i < numOfChan; i++) {             // interleave channels
                sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
                sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
                view.setInt16(pos, sample, true);          // write 16-bit sample
                pos += 2;
            }
            offset++; // next source sample
        }

        return new Blob([buffer], { type: 'audio/wav' });

        function setUint16(data) {
            view.setUint16(pos, data, true);
            pos += 2;
        }

        function setUint32(data) {
            view.setUint32(pos, data, true);
            pos += 4;
        }
    }
});
