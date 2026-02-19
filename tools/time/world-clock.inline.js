import '../../js/utils/common.js';

// Timezones list
const timezones = [
    "America/New_York", "America/Los_Angeles", "America/Chicago",
    "Europe/London", "Europe/Paris", "Europe/Berlin",
    "Asia/Tokyo", "Asia/Dubai", "Asia/Singapore",
    "Australia/Sydney", "Pacific/Auckland", "UTC"
];

const select = document.getElementById('timezoneSelect');
const grid = document.getElementById('clockGrid');
const addBtn = document.getElementById('addClockBtn');

// Populate Select
timezones.sort().forEach(tz => {
    const option = document.createElement('option');
    option.value = tz;
    option.textContent = tz.replace('_', ' ');
    select.appendChild(option);
});

// Load Saved Clocks
let savedClocks = JSON.parse(localStorage.getItem('vtoolz_clocks')) || ["America/New_York", "Europe/London", "Asia/Tokyo"];

function saveClocks() {
    localStorage.setItem('vtoolz_clocks', JSON.stringify(savedClocks));
}

function renderClocks() {
    grid.innerHTML = '';
    savedClocks.forEach((tz, index) => {
        const card = document.createElement('div');
        card.className = 'clock-card';
        card.innerHTML = `
            <button class="delete-clock" data-index="${index}">&times;</button>
            <h3>${tz.split('/')[1].replace('_', ' ')}</h3>
            <div class="clock-time" id="time-${index}">--:--</div>
            <div class="clock-date" id="date-${index}">--</div>
        `;
        grid.appendChild(card);
    });

    // Re-attach listeners
    document.querySelectorAll('.delete-clock').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = e.target.dataset.index;
            savedClocks.splice(idx, 1);
            saveClocks();
            renderClocks();
            updateTime(); // quick refresh
        });
    });
    updateTime();
}

function updateTime() {
    const now = new Date();
    savedClocks.forEach((tz, index) => {
        const timeEl = document.getElementById(`time-${index}`);
        const dateEl = document.getElementById(`date-${index}`);

        if (timeEl && dateEl) {
            try {
                const timeString = new Intl.DateTimeFormat('en-US', {
                    timeZone: tz,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                }).format(now);

                const dateString = new Intl.DateTimeFormat('en-US', {
                    timeZone: tz,
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                }).format(now);

                timeEl.textContent = timeString;
                dateEl.textContent = dateString;
            } catch (e) {
                console.error("Timezone error", e);
            }
        }
    });
}

addBtn.addEventListener('click', () => {
    const val = select.value;
    if (val && !savedClocks.includes(val)) {
        savedClocks.push(val);
        saveClocks();
        renderClocks();
    } else if (savedClocks.includes(val)) {
        alert("Clock already exists!");
    }
});

// Initialize
renderClocks();
setInterval(updateTime, 1000);