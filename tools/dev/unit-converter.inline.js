const units = {
    length: {
        base: 'm',
        rates: { m: 1, km: 0.001, cm: 100, mm: 1000, in: 39.3701, ft: 3.28084, yd: 1.09361, mi: 0.000621371 }
    },
    weight: {
        base: 'kg',
        rates: { kg: 1, g: 1000, mg: 1000000, lb: 2.20462, oz: 35.274 }
    },
    data: {
        base: 'B',
        rates: { B: 1, KB: 1 / 1024, MB: 1 / 1048576, GB: 1 / 1073741824, TB: 1 / 1099511627776 }
    },
    time: {
        base: 's',
        rates: { s: 1, m: 1 / 60, h: 1 / 3600, d: 1 / 86400, w: 1 / 604800 }
    },
    temperature: {
        special: true // Needs formula
    },
    currency: {
        base: 'USD',
        rates: { USD: 1, EUR: 0.93, GBP: 0.79, INR: 83.00, JPY: 150.00, CAD: 1.35, AUD: 1.53 }, // Fallback
        symbol: { USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥' }
    }
};

let currentType = 'length';

const inputVal = document.getElementById('inputVal');
const outputVal = document.getElementById('outputVal');
const fromUnit = document.getElementById('fromUnit');
const toUnit = document.getElementById('toUnit');
const swapBtn = document.getElementById('swapBtn');
const rateInfo = document.getElementById('rateInfo');

// Initialize
function init() {
    setupTypeButtons();
    loadUnits(currentType);
    addListeners();
    convert();
}

function setupTypeButtons() {
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentType = btn.dataset.type;
            loadUnits(currentType);
            convert();
        });
    });
}

function loadUnits(type) {
    fromUnit.innerHTML = '';
    toUnit.innerHTML = '';

    if (type === 'temperature') {
        const tempUnits = ['Celsius', 'Fahrenheit', 'Kelvin'];
        tempUnits.forEach(u => {
            fromUnit.add(new Option(u, u));
            toUnit.add(new Option(u, u));
        });
        toUnit.selectedIndex = 1;
    } else {
        const keys = Object.keys(units[type].rates);
        keys.forEach(u => {
            fromUnit.add(new Option(u, u));
            toUnit.add(new Option(u, u));
        });
        // Set default different unit
        if (keys.length > 1) toUnit.selectedIndex = 1;

        if (type === 'currency') {
            fetchCurrencyRates();
        } else {
            rateInfo.style.display = 'none';
        }
    }
}

function convert() {
    const val = parseFloat(inputVal.value);
    if (isNaN(val)) {
        outputVal.value = '';
        return;
    }

    const from = fromUnit.value;
    const to = toUnit.value;
    let result;

    if (currentType === 'temperature') {
        result = convertTemp(val, from, to);
    } else {
        const rateFrom = units[currentType].rates[from];
        const rateTo = units[currentType].rates[to];
        // Convert to base, then to target
        const baseVal = val / rateFrom;
        result = baseVal * rateTo;
    }

    // Formatting
    if (currentType === 'currency') {
        outputVal.value = result.toFixed(2);
    } else if (result < 0.000001 || result > 1000000) {
        outputVal.value = result.toExponential(4);
    } else {
        outputVal.value = parseFloat(result.toPrecision(6)); // Clean up floating point errors
    }
}

function convertTemp(val, from, to) {
    if (from === to) return val;
    let cel;
    // To Celsius
    if (from === 'Celsius') cel = val;
    if (from === 'Fahrenheit') cel = (val - 32) * 5 / 9;
    if (from === 'Kelvin') cel = val - 273.15;

    // From Celsius
    if (to === 'Celsius') return cel;
    if (to === 'Fahrenheit') return (cel * 9 / 5) + 32;
    if (to === 'Kelvin') return cel + 273.15;
}

function addListeners() {
    inputVal.addEventListener('input', convert);
    fromUnit.addEventListener('change', convert);
    toUnit.addEventListener('change', convert);
    swapBtn.addEventListener('click', () => {
        const temp = fromUnit.value;
        fromUnit.value = toUnit.value;
        toUnit.value = temp;
        convert();
    });
}

async function fetchCurrencyRates() {
    // Only fetch if strictly currency and online
    if (!navigator.onLine) {
        rateInfo.textContent = "Offline mode: Estimated rates used.";
        rateInfo.style.display = 'block';
        return;
    }

    rateInfo.textContent = "Fetching live rates...";
    rateInfo.style.display = 'block';

    try {
        // Using frankfurter.app (Open API, no key)
        const res = await fetch('https://api.frankfurter.app/latest?from=USD');
        const data = await res.json();

        // Update USD base rates
        if (data && data.rates) {
            // Update our internal table relative to USD
            units.currency.rates = { USD: 1, ...data.rates };
            rateInfo.textContent = `Live rates updated: ${data.date}`;
            convert(); // Recalculate
        }
    } catch (e) {
        rateInfo.textContent = "Could not fetch live rates. Using estimates.";
        console.error(e);
    }
}

// Call init
init();