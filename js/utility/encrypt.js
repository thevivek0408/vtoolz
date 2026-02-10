import { Utils } from '../utils/common.js';

document.addEventListener('DOMContentLoaded', () => {

    // --- ENCRYPT ---
    const dropEnc = document.getElementById('drop-enc');
    const inputEnc = document.getElementById('input-enc');
    const passEnc = document.getElementById('pass-enc');
    const btnEnc = document.getElementById('btn-encrypt');
    const statusEnc = document.getElementById('status-enc');
    let fileToEncrypt = null;

    Utils.setupDragAndDrop(dropEnc, inputEnc, (file) => {
        fileToEncrypt = file;
        document.getElementById('file-enc-name').textContent = `${file.name} (${Utils.formatBytes(file.size)})`;
    });

    btnEnc.addEventListener('click', async () => {
        if (!fileToEncrypt) return Utils.showToast("Select a file first", "error");
        if (!passEnc.value) return Utils.showToast("Enter a password", "error");

        try {
            statusEnc.textContent = "Encrypting...";
            const encryptedBlob = await encryptFile(fileToEncrypt, passEnc.value);
            Utils.downloadBlob(encryptedBlob, `${fileToEncrypt.name}.vtoolz`);

            statusEnc.textContent = "Done!";
            Utils.showToast("File Encrypted via AES-256", "success");
        } catch (err) {
            console.error(err);
            statusEnc.textContent = "Error";
            Utils.showToast("Encryption Failed", "error");
        }
    });


    // --- DECRYPT ---
    const dropDec = document.getElementById('drop-dec');
    const inputDec = document.getElementById('input-dec');
    const passDec = document.getElementById('pass-dec');
    const btnDec = document.getElementById('btn-decrypt');
    const statusDec = document.getElementById('status-dec');
    let fileToDecrypt = null;

    Utils.setupDragAndDrop(dropDec, inputDec, (file) => {
        if (!file.name.endsWith('.vtoolz')) {
            Utils.showToast("Expected .vtoolz file", "warning");
        }
        fileToDecrypt = file;
        document.getElementById('file-dec-name').textContent = `${file.name}`;
    });

    btnDec.addEventListener('click', async () => {
        if (!fileToDecrypt) return Utils.showToast("Select a file first", "error");
        if (!passDec.value) return Utils.showToast("Enter password", "error");

        try {
            statusDec.textContent = "Decrypting...";
            const decryptedBlob = await decryptFile(fileToDecrypt, passDec.value);

            // Clean filename (remove .vtoolz) - wait, our format might need to store filename?
            // For simplicity, we just strip .vtoolz. The actual file type will be detected by OS/User, 
            // OR we can rely on proper mime type restoration if we stored it?
            // The simple version below assumes user knows what it was.
            // Better: We stored metadata? No, keeping it simple raw stream for now unless we add header.
            // Actually, let's just strip .vtoolz. If original was image.png.vtoolz -> image.png
            let name = fileToDecrypt.name.replace('.vtoolz', '');
            if (name === fileToDecrypt.name) name += '.decrypted'; // Fallback

            Utils.downloadBlob(decryptedBlob, name);
            statusDec.textContent = "Done!";
            Utils.showToast("File Decrypted Successfully", "success");
        } catch (err) {
            console.error(err);
            statusDec.textContent = "Wrong Password?";
            Utils.showToast("Decryption Failed. Wrong Password?", "error");
        }
    });


    // --- CRYPTO HELPERS (Web Crypto API) ---

    async function encryptFile(file, password) {
        // 1. Generate Key from Password
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const key = await getKey(password, salt);

        // 2. Encrypt
        const iv = window.crypto.getRandomValues(new Uint8Array(12)); // AES-GCM IV
        const fileData = await file.arrayBuffer();
        const encryptedContent = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            key,
            fileData
        );

        // 3. Pack (Salt + IV + EncryptedData)
        // We need Salt and IV to decrypt.
        const blob = new Blob([salt, iv, encryptedContent], { type: "application/octet-stream" });
        return blob;
    }

    async function decryptFile(file, password) {
        const data = await file.arrayBuffer();

        // Extract parts
        const salt = data.slice(0, 16);
        const iv = data.slice(16, 28); // 12 bytes IV
        const encryptedContent = data.slice(28);

        // 1. Regenerate Key
        const key = await getKey(password, salt);

        // 2. Decrypt
        const decryptedContent = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            key,
            encryptedContent
        );

        return new Blob([decryptedContent]);
    }

    async function getKey(password, salt) {
        const enc = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            "raw",
            enc.encode(password),
            { name: "PBKDF2" },
            false,
            ["deriveKey"]
        );

        return window.crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: 100000,
                hash: "SHA-256"
            },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt", "decrypt"]
        );
    }

});
