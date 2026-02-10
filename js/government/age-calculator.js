import { Utils } from '../utils/common.js';

document.addEventListener('DOMContentLoaded', () => {
    const dobInput = document.getElementById('dob');
    const refDateInput = document.getElementById('ref-date');
    const btnCalc = document.getElementById('btn-calc');
    const btnReset = document.getElementById('btn-reset');
    const resultCard = document.getElementById('result');

    // Default ref date to today
    refDateInput.valueAsDate = new Date();

    btnCalc.addEventListener('click', calculateAge);
    btnReset.addEventListener('click', () => {
        dobInput.value = '';
        refDateInput.valueAsDate = new Date();
        resultCard.style.display = 'none';
    });

    function calculateAge() {
        const dobVal = dobInput.value;
        const refVal = refDateInput.value;

        if (!dobVal) {
            Utils.showToast("Please enter Date of Birth", "error");
            return;
        }

        const dob = new Date(dobVal);
        const ref = new Date(refVal);

        if (dob > ref) {
            Utils.showToast("Date of Birth cannot be after Reference Date!", "error");
            return;
        }

        let years = ref.getFullYear() - dob.getFullYear();
        let months = ref.getMonth() - dob.getMonth();
        let days = ref.getDate() - dob.getDate();

        // Adjust for negative days
        if (days < 0) {
            months--;
            // Get days in previous month
            const prevMonthDate = new Date(ref.getFullYear(), ref.getMonth(), 0);
            days += prevMonthDate.getDate();
        }

        // Adjust for negative months
        if (months < 0) {
            years--;
            months += 12;
        }

        // Display
        document.getElementById('res-years').textContent = years;
        document.getElementById('res-months').textContent = months;
        document.getElementById('res-days').textContent = days;

        // Next Birthday
        const today = new Date();
        let nextBday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
        if (today > nextBday) {
            nextBday.setFullYear(today.getFullYear() + 1);
        }
        const one_day = 1000 * 60 * 60 * 24;
        const daysLeft = Math.ceil((nextBday.getTime() - today.getTime()) / one_day);

        let bdayMsg = "";
        if (daysLeft === 0) bdayMsg = "Today! Happy Birthday! 🎂";
        else bdayMsg = `${daysLeft} days`;

        document.getElementById('next-bday').textContent = bdayMsg;

        // Eligibility Check (Simple visual for now)
        // Common Exams: 18-27, 20-30, etc.
        // We can just show standard ranges.
        /*
        const eligBox = document.getElementById('eligibility-box');
        if (years >= 18 && years <= 27) {
           eligBox.innerHTML = '<span class="status-badge status-success">Eligible for SSC CHSL/MTS (typically)</span>';
        } else if (years >= 21 && years <= 32) {
             eligBox.innerHTML = '<span class="status-badge status-success">Eligible for UPSC CSE (General)</span>';
        } else {
             eligBox.innerHTML = '<span class="text-muted">Check specific notification for age limits.</span>';
        }
        */

        resultCard.style.display = 'block';

        // Scroll to result on mobile
        if (window.innerWidth < 768) {
            resultCard.scrollIntoView({ behavior: 'smooth' });
        }
    }
});
