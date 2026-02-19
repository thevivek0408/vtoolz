import '../../js/utils/common.js';

// Simplified Emoji List for MVP
const emojis = [
    { char: "😀", name: "grinning face smile" },
    { char: "😂", name: "joy tears laugh" },
    { char: "🥰", name: "smiling face with hearts love" },
    { char: "😎", name: "sunglasses cool" },
    { char: "🤔", name: "thinking face" },
    { char: "😭", name: "loudly crying face sad" },
    { char: "😡", name: "pouting face angry mad" },
    { char: "👍", name: "thumbs up like" },
    { char: "👎", name: "thumbs down dislike" },
    { char: "❤️", name: "red heart love" },
    { char: "🔥", name: "fire hot lit" },
    { char: "✨", name: "sparkles" },
    { char: "🎉", name: "party popper celebration" },
    { char: "🚀", name: "rocket ship launch" },
    { char: "🐱", name: "cat face" },
    { char: "🐶", name: "dog face" },
    { char: "🍕", name: "pizza food" },
    { char: "🍔", name: "hamburger food" },
    { char: "🍺", name: "beer mug drink" },
    { char: "⚽", name: "soccer ball sports" },
    { char: "🎮", name: "video game controller" },
    { char: "🎵", name: "musical note" },
    { char: "💡", name: "light bulb idea" },
    { char: "💰", name: "money bag" },
    { char: "💯", name: "hundred points" },
    { char: "💀", name: "skull dead" },
    { char: "🤡", name: "clown face" },
    { char: "👽", name: "alien" },
    { char: "🤖", name: "robot" },
    { char: "🎃", name: "jack-o-lantern halloween" },
    { char: "👋", name: "waving hand hello" },
    { char: "🙏", name: "folded hands pray" },
    { char: "💪", name: "flexed biceps strength" },
    { char: "🧠", name: "brain" },
    { char: "👀", name: "eyes" },
    { char: "🌈", name: "rainbow" },
    { char: "☀️", name: "sun" },
    { char: "🌙", name: "crescent moon" },
    { char: "⭐", name: "star" },
    { char: "⚡", name: "high voltage zap" },
    { char: "💻", name: "laptop computer" },
    { char: "📱", name: "mobile phone" },
    { char: "🔒", name: "lock security" },
    { char: "🔑", name: "key" },
    { char: "🔨", name: "hammer tool" },
    { char: "⚙️", name: "gear settings" },
    { char: "✅", name: "check mark button" },
    { char: "❌", name: "cross mark" },
    { char: "❓", name: "question mark" },
    { char: "❗", name: "exclamation mark" },
];
// Note: A real implementation would use a full JSON dataset.

const grid = document.getElementById('emojiGrid');
const searchInput = document.getElementById('search');
const toast = document.getElementById('toast');

function render(filter = "") {
    grid.innerHTML = "";
    const term = filter.toLowerCase();
    emojis.forEach(e => {
        if (e.name.includes(term)) {
            const el = document.createElement('div');
            el.className = 'emoji-item';
            el.textContent = e.char;
            el.title = e.name;
            el.addEventListener('click', () => {
                navigator.clipboard.writeText(e.char);
                showToast(`Copied ${e.char}`);
            });
            grid.appendChild(el);
        }
    });
}

function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

searchInput.addEventListener('input', (e) => render(e.target.value));

render();