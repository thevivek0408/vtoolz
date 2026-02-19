document.querySelector('.keypad').innerHTML = `
    <button class="btn-calc" onclick="appendChar('7')">7</button>
    <button class="btn-calc" onclick="appendChar('8')">8</button>
    <button class="btn-calc" onclick="appendChar('9')">9</button>
    <button class="btn-calc operator" onclick="appendChar('/')">÷</button>

    <button class="btn-calc" onclick="appendChar('4')">4</button>
    <button class="btn-calc" onclick="appendChar('5')">5</button>
    <button class="btn-calc" onclick="appendChar('6')">6</button>
    <button class="btn-calc operator" onclick="appendChar('*')">×</button>

    <button class="btn-calc" onclick="appendChar('1')">1</button>
    <button class="btn-calc" onclick="appendChar('2')">2</button>
    <button class="btn-calc" onclick="appendChar('3')">3</button>
    <button class="btn-calc operator" onclick="appendChar('-')">-</button>

    <button class="btn-calc" onclick="appendChar('0')">0</button>
    <button class="btn-calc" onclick="appendChar('.')">.</button>
    <button class="btn-calc equals" onclick="calculate()">=</button>
    <button class="btn-calc operator" onclick="appendChar('+')">+</button>
`;
// Fix grid span for equals
const equalsBtn = document.querySelector('.btn-calc.equals');
equalsBtn.style.gridColumn = "span 1";
// Wait, standard is 4 cols. 0 . = + . 
// Let's do: 0 . = +