/**
 * Developer Utilities
 */

export const DevUtils = {
    // JSON
    formatJson: (jsonString) => JSON.stringify(JSON.parse(jsonString), null, 4),
    minifyJson: (jsonString) => JSON.stringify(JSON.parse(jsonString)),
    jsonToCsv: (jsonString) => {
        const obj = JSON.parse(jsonString);
        const array = Array.isArray(obj) ? obj : [obj];
        if (array.length === 0) return '';

        const headers = Object.keys(array[0]);
        const csvRows = [headers.join(',')];

        for (const row of array) {
            const values = headers.map(header => {
                const escaped = ('' + row[header]).replace(/"/g, '\\"');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(','));
        }
        return csvRows.join('\n');
    },

    // Encoding
    base64Encode: (str) => btoa(unescape(encodeURIComponent(str))),
    base64Decode: (str) => decodeURIComponent(escape(atob(str))),
    urlEncode: (str) => encodeURIComponent(str),
    urlDecode: (str) => decodeURIComponent(str),

    // Minifiers (Basic Regex - good enough for client side simple tools)
    minifyHtml: (html) => html.replace(/>\s+</g, '><').replace(/<!--[\s\S]*?-->/g, '').trim(),
    minifyCss: (css) => css.replace(/\s+/g, ' ').replace(/\s*([{}:;,])\s*/g, '$1').replace(/\/\*[\s\S]*?\*\//g, '').trim(),
    minifyJs: (js) => {
        // Very basic, risky for complex JS implies simple script usage
        // Removing comments and multiple spaces
        return js.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim();
    },

    // Security
    generateHash: async (message, algo = 'SHA-256') => {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest(algo, msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    generatePassword: (length = 16, options = { upper: true, lower: true, numbers: true, symbols: true }) => {
        const chars = {
            upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            lower: 'abcdefghijklmnopqrstuvwxyz',
            numbers: '0123456789',
            symbols: '!@#$%^&*()_+~`|}{[]:;?><,./-='
        };

        let charSet = '';
        if (options.upper) charSet += chars.upper;
        if (options.lower) charSet += chars.lower;
        if (options.numbers) charSet += chars.numbers;
        if (options.symbols) charSet += chars.symbols;

        if (charSet === '') return '';

        let password = '';
        const array = new Uint32Array(length);
        window.crypto.getRandomValues(array);

        for (let i = 0; i < length; i++) {
            password += charSet[array[i] % charSet.length];
        }
        return password;
    },

    checkPasswordStrength: (password) => {
        let score = 0;
        if (password.length > 8) score++;
        if (password.length > 12) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        const ratings = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
        return { score, rating: ratings[score] || 'Weak' };
    },

    // Units
    convertBytes: (value, fromUnit, toUnit) => {
        // simplistic conversion
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        const fromIndex = units.indexOf(fromUnit);
        const toIndex = units.indexOf(toUnit);
        if (fromIndex === -1 || toIndex === -1) return 0;

        const bytes = value * Math.pow(1024, fromIndex);
        return bytes / Math.pow(1024, toIndex);
    }
};
