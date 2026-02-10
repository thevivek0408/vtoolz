import { Utils } from '../utils/common.js';

document.addEventListener('DOMContentLoaded', () => {
    const ssid = document.getElementById('ssid');
    const password = document.getElementById('password');
    const encryption = document.getElementById('encryption');
    const hidden = document.getElementById('hidden');
    const btnGenerate = document.getElementById('btn-generate');
    const resultDiv = document.getElementById('result');
    const qrcodeDiv = document.getElementById('qrcode');
    const togglePw = document.getElementById('toggle-pw');

    let qrObj = null;

    togglePw.addEventListener('click', () => {
        if (password.type === 'password') {
            password.type = 'text';
            togglePw.classList.remove('fa-eye');
            togglePw.classList.add('fa-eye-slash');
        } else {
            password.type = 'password';
            togglePw.classList.remove('fa-eye-slash');
            togglePw.classList.add('fa-eye');
        }
    });

    btnGenerate.addEventListener('click', () => {
        const s = ssid.value.trim();
        const p = password.value;
        const e = encryption.value;
        const h = hidden.checked;

        if (!s) {
            Utils.showToast("Please enter Network Name (SSID)", "error");
            return;
        }

        // WiFi QR Format: WIFI:T:WPA;S:mynetwork;P:mypass;;
        // Special chars need escaping: \ " ; , :
        const escapeParams = (str) => str.replace(/([\\";, :])/g, '\\$1');

        // Construct string
        let content = `WIFI:T:${e};S:${escapeParams(s)};`;
        if (e !== 'nopass') {
            content += `P:${escapeParams(p)};`;
        }
        if (h) {
            content += `H:true;`;
        }
        content += `;`;

        // Render QR
        qrcodeDiv.innerHTML = ''; // Clear prev
        resultDiv.style.display = 'block';

        qrObj = new QRCode(qrcodeDiv, {
            text: content,
            width: 256,
            height: 256,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });

        Utils.showToast("QR Code Generated!", "success");
    });

    document.getElementById('btn-download').addEventListener('click', () => {
        const img = qrcodeDiv.querySelector('img');
        if (img && img.src) {
            const link = document.createElement('a');
            link.download = `WiFi-${ssid.value || 'network'}-QR.png`;
            link.href = img.src;
            link.click();
        }
    });

    document.getElementById('btn-print').addEventListener('click', () => {
        // Open print window logic or just window.print()
        const win = window.open('', '', 'height=600,width=800');
        win.document.write('<html><head><title>Print WiFi QR</title>');
        win.document.write('</head><body style="text-align:center; font-family: sans-serif;">');
        win.document.write('<h1>WiFi Connection</h1>');
        win.document.write('<h2>Network: ' + ssid.value + '</h2>');
        win.document.write(qrcodeDiv.innerHTML);
        win.document.write('<p>Scan to Connect</p>');
        win.document.write('</body></html>');
        win.document.close();
        win.focus();
        win.print();
    });
});
