import { Utils } from '../utils/common.js';

document.addEventListener('DOMContentLoaded', () => {
    const synth = window.speechSynthesis;
    const textInput = document.getElementById('text-input');
    const voiceSelect = document.getElementById('voice-select');
    const rateInput = document.getElementById('rate');
    const pitchInput = document.getElementById('pitch');
    const rateVal = document.getElementById('rate-val');
    const pitchVal = document.getElementById('pitch-val');
    const btnSpeak = document.getElementById('btn-speak');
    const btnPause = document.getElementById('btn-pause');
    const btnStop = document.getElementById('btn-stop');

    let voices = [];

    // Init Logic
    function populateVoices() {
        voices = synth.getVoices().sort((a, b) => {
            const aname = a.name.toUpperCase();
            const bname = b.name.toUpperCase();
            return aname < bname ? -1 : aname == bname ? 0 : 1;
        });

        voiceSelect.innerHTML = '';
        voices.forEach((voice) => {
            const option = document.createElement('option');
            option.textContent = `${voice.name} (${voice.lang})`;
            option.setAttribute('data-lang', voice.lang);
            option.setAttribute('data-name', voice.name);
            voiceSelect.appendChild(option);

            // Auto-select English (Google or Microsoft) if available
            if (voice.name.includes("Google US English") || voice.name.includes("Microsoft David")) {
                option.selected = true;
            }
        });
    }

    populateVoices();

    // Some browsers load voices asynchronously
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = populateVoices;
    }

    // Controls
    rateInput.addEventListener('input', () => rateVal.textContent = rateInput.value);
    pitchInput.addEventListener('input', () => pitchVal.textContent = pitchInput.value);

    // Speak
    btnSpeak.addEventListener('click', () => {
        if (synth.speaking) {
            // If paused, resume
            if (synth.paused) {
                synth.resume();
                btnSpeak.textContent = "▶ Speak";
                return;
            }
            // else stop and restart?
            synth.cancel();
        }

        const text = textInput.value;
        if (text !== '') {
            const utterThis = new SpeechSynthesisUtterance(text);

            const selectedOption = voiceSelect.selectedOptions[0].getAttribute('data-name');
            const selectedVoice = voices.find(v => v.name === selectedOption);

            utterThis.voice = selectedVoice;
            utterThis.pitch = pitchInput.value;
            utterThis.rate = rateInput.value;

            // Visual Feedback
            utterThis.onstart = () => {
                textInput.classList.add('speaking');
                btnSpeak.disabled = true;
            };

            utterThis.onend = () => {
                textInput.classList.remove('speaking');
                btnSpeak.disabled = false;
                btnSpeak.textContent = "▶ Speak";
            };

            utterThis.onerror = (e) => {
                console.error(e);
                textInput.classList.remove('speaking');
                btnSpeak.disabled = false;
            };

            synth.speak(utterThis);
        }
    });

    // Pause
    btnPause.addEventListener('click', () => {
        if (synth.speaking && !synth.paused) {
            synth.pause();
            btnSpeak.textContent = "▶ Resume";
            btnSpeak.disabled = false; // Allow clicking resume
        }
    });

    // Stop
    btnStop.addEventListener('click', () => {
        synth.cancel();
        textInput.classList.remove('speaking');
        btnSpeak.disabled = false;
        btnSpeak.textContent = "▶ Speak";
    });

    // Cleanup on exit
    window.addEventListener('beforeunload', () => {
        synth.cancel();
    });
});
