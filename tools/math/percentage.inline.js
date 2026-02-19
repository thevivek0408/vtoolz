import '../../js/utils/common.js';

function calculate() {
    // Case 1
    const p1_num = parseFloat(document.getElementById('p1_num').value);
    const p1_total = parseFloat(document.getElementById('p1_total').value);
    if (!isNaN(p1_num) && !isNaN(p1_total)) {
        document.getElementById('p1_result').textContent = ((p1_num / 100) * p1_total).toFixed(2);
    } else {
        document.getElementById('p1_result').textContent = '--';
    }

    // Case 2
    const p2_num = parseFloat(document.getElementById('p2_num').value);
    const p2_total = parseFloat(document.getElementById('p2_total').value);
    if (!isNaN(p2_num) && !isNaN(p2_total) && p2_total !== 0) {
        document.getElementById('p2_result').textContent = ((p2_num / p2_total) * 100).toFixed(2) + '%';
    } else {
        document.getElementById('p2_result').textContent = '--';
    }

    // Case 3
    const p3_from = parseFloat(document.getElementById('p3_from').value);
    const p3_to = parseFloat(document.getElementById('p3_to').value);
    if (!isNaN(p3_from) && !isNaN(p3_to) && p3_from !== 0) {
        const diff = p3_to - p3_from;
        const change = (diff / p3_from) * 100;
        const sign = change > 0 ? '+' : '';
        document.getElementById('p3_result').textContent = sign + change.toFixed(2) + '%';
        document.getElementById('p3_result').style.color = change >= 0 ? 'var(--success-color)' : 'var(--danger-color)';
    } else {
        document.getElementById('p3_result').textContent = '--';
        document.getElementById('p3_result').style.color = 'var(--primary-color)';
    }
}

// Add listeners to all inputs
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', calculate);
});