import '../../js/utils/common.js';

let isMetric = true;

const btnMetric = document.getElementById('btnMetric');
const btnImperial = document.getElementById('btnImperial');
const metricInputs = document.getElementById('metricInputs');
const imperialInputs = document.getElementById('imperialInputs');

// Toggle Units
btnMetric.addEventListener('click', () => {
    isMetric = true;
    btnMetric.classList.add('active');
    btnImperial.classList.remove('active');
    metricInputs.style.display = 'block';
    imperialInputs.style.display = 'none';
});

btnImperial.addEventListener('click', () => {
    isMetric = false;
    btnImperial.classList.add('active');
    btnMetric.classList.remove('active');
    metricInputs.style.display = 'none';
    imperialInputs.style.display = 'block';
});

// Calculate
document.getElementById('calculateBtn').addEventListener('click', () => {
    let height, weight, bmi;

    if (isMetric) {
        const h = parseFloat(document.getElementById('heightCm').value);
        const w = parseFloat(document.getElementById('weightKg').value);
        if (!h || !w) return alert("Please enter valid inputs");
        height = h / 100; // cm to m
        weight = w;
        bmi = weight / (height * height);
    } else {
        const ft = parseFloat(document.getElementById('heightFt').value) || 0;
        const inches = parseFloat(document.getElementById('heightIn').value) || 0;
        const w = parseFloat(document.getElementById('weightLbs').value);

        if ((!ft && !inches) || !w) return alert("Please enter valid inputs");

        const totalInches = (ft * 12) + inches;
        bmi = 703 * (w / (totalInches * totalInches));
    }

    // Display Results
    const valueEl = document.getElementById('bmiValue');
    const catEl = document.getElementById('bmiCategory');
    const resultEl = document.getElementById('result');

    bmi = Math.min(Math.max(bmi, 10), 50); // Clamp for visualization safety
    const finalBmi = bmi.toFixed(1);

    valueEl.textContent = finalBmi;
    resultEl.style.display = 'block';

    let category = "";
    let color = "";

    if (bmi < 18.5) {
        category = "Underweight";
        color = "#3498db";
    } else if (bmi < 25) {
        category = "Normal Weight";
        color = "#2ecc71";
    } else if (bmi < 30) {
        category = "Overweight";
        color = "#f1c40f";
    } else {
        category = "Obese";
        color = "#e74c3c";
    }

    catEl.textContent = category;
    catEl.style.color = color;

    // Marker position (Linear mapping 10-40 range roughly)
    // 15 = 0%, 35 = 100% of bar? 
    // Let's blindly map 10 to 45 BMI to 0% to 100%
    const minGrid = 15;
    const maxGrid = 40;
    let percent = ((bmi - minGrid) / (maxGrid - minGrid)) * 100;
    percent = Math.min(Math.max(percent, 0), 100);

    document.getElementById('bmiMarker').style.left = percent + '%';
});