import '../../js/utils/common.js';

const paraCount = document.getElementById('paraCount');
const generateBtn = document.getElementById('generateBtn');
const copyBtn = document.getElementById('copyBtn');
const output = document.getElementById('output');

const lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

function generate() {
    const count = parseInt(paraCount.value) || 3;
    let text = [];
    for (let i = 0; i < count; i++) {
        text.push(lorem);
    }
    output.value = text.join('\n\n');
}

generateBtn.addEventListener('click', generate);

copyBtn.addEventListener('click', () => {
    output.select();
    document.execCommand('copy');
    // Assuming common.js has showToast or similar, checking previously
});

// Initial
generate();