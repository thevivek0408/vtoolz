import '../../js/utils/common.js';

// Safe math expression evaluator — recursive descent parser (no eval/new Function)
// Supports: numbers, +, -, *, /, %, (), and whitelisted Math functions/constants
function safeMathEval(expr) {
    const MATH_FUNCS = {
        'sin': Math.sin, 'cos': Math.cos, 'tan': Math.tan,
        'asin': Math.asin, 'acos': Math.acos, 'atan': Math.atan,
        'sqrt': Math.sqrt, 'cbrt': Math.cbrt, 'abs': Math.abs,
        'ceil': Math.ceil, 'floor': Math.floor, 'round': Math.round,
        'log': Math.log, 'log2': Math.log2, 'log10': Math.log10,
        'exp': Math.exp
    };
    const MATH_FUNCS_2ARG = { 'pow': Math.pow };
    const MATH_CONSTS = {
        'PI': Math.PI, 'E': Math.E, 'LN2': Math.LN2,
        'LN10': Math.LN10, 'SQRT2': Math.SQRT2
    };

    let pos = 0;
    const str = expr.replace(/\s/g, '');

    function peek() { return str[pos]; }
    function consume(ch) {
        if (str[pos] !== ch) throw new Error(`Expected '${ch}' at position ${pos}`);
        pos++;
    }

    // expression = term (('+' | '-') term)*
    function parseExpression() {
        let result = parseTerm();
        while (pos < str.length && (peek() === '+' || peek() === '-')) {
            const op = str[pos++];
            const right = parseTerm();
            result = op === '+' ? result + right : result - right;
        }
        return result;
    }

    // term = factor (('*' | '/' | '%') factor)*
    function parseTerm() {
        let result = parseFactor();
        while (pos < str.length && (peek() === '*' || peek() === '/' || peek() === '%')) {
            const op = str[pos++];
            const right = parseFactor();
            if (op === '*') result *= right;
            else if (op === '/') result /= right;
            else result %= right;
        }
        return result;
    }

    // factor = unary ('^' factor)? — right-associative exponent
    function parseFactor() {
        let base = parseUnary();
        if (pos < str.length && peek() === '^') {
            pos++;
            base = Math.pow(base, parseFactor());
        }
        return base;
    }

    // unary = '-' unary | '+' unary | atom
    function parseUnary() {
        if (peek() === '-') { pos++; return -parseUnary(); }
        if (peek() === '+') { pos++; return parseUnary(); }
        return parseAtom();
    }

    // atom = number | '(' expression ')' | Math.func(expr) | Math.CONST
    function parseAtom() {
        // Parenthesized expression
        if (peek() === '(') {
            pos++;
            const val = parseExpression();
            consume(')');
            return val;
        }

        // Math.func or Math.CONST
        if (str.substring(pos, pos + 5).match(/^Math\./)) {
            pos += 5; // skip 'Math.'
            let name = '';
            while (pos < str.length && /[a-zA-Z0-9]/.test(str[pos])) name += str[pos++];

            if (MATH_CONSTS[name] !== undefined) return MATH_CONSTS[name];

            if (MATH_FUNCS[name]) {
                consume('(');
                const arg = parseExpression();
                consume(')');
                return MATH_FUNCS[name](arg);
            }

            if (MATH_FUNCS_2ARG[name]) {
                consume('(');
                const arg1 = parseExpression();
                consume(',');
                const arg2 = parseExpression();
                consume(')');
                return MATH_FUNCS_2ARG[name](arg1, arg2);
            }

            throw new Error(`Unknown function: Math.${name}`);
        }

        // Number (integer or decimal)
        let numStr = '';
        while (pos < str.length && (/[0-9.]/.test(str[pos]))) numStr += str[pos++];
        if (numStr === '') throw new Error(`Unexpected character: '${peek()}' at position ${pos}`);
        return parseFloat(numStr);
    }

    const result = parseExpression();
    if (pos < str.length) throw new Error(`Unexpected character: '${str[pos]}' at position ${pos}`);
    return result;
}

const display = document.getElementById('result');
const history = document.getElementById('history');
let currentExpr = '';

window.appendChar = (char) => {
    if (display.textContent === '0' && char !== '.') {
        display.textContent = '';
        currentExpr = '';
    }
    // Display logic vs Calc logic
    if (char === '*') display.textContent += '×';
    else if (char === '/') display.textContent += '÷';
    else display.textContent += char;

    currentExpr += char;
};

window.appendFunc = (func) => {
    if (display.textContent === '0') {
        display.textContent = '';
        currentExpr = '';
    }
    const funcName = func.replace('Math.', '').replace('(', '');
    display.textContent += funcName + '(';
    currentExpr += func;
}

window.clearDisplay = () => {
    display.textContent = '0';
    currentExpr = '';
    history.textContent = '';
};

window.backspace = () => {
    display.textContent = display.textContent.slice(0, -1);
    currentExpr = currentExpr.slice(0, -1);
    if (display.textContent === '') display.textContent = '0';
};

window.calculate = () => {
    try {
        history.textContent = display.textContent + ' =';
        // Safe math evaluation — only allows numbers, operators, Math functions, and parentheses
        let result = safeMathEval(currentExpr);

        // Format decimal
        if (result % 1 !== 0) {
            result = parseFloat(result.toFixed(8)); // Avoid 0.000000004
        }

        display.textContent = result;
        currentExpr = result.toString();
    } catch (e) {
        display.textContent = 'Error';
        currentExpr = '';
    }
};

// Keyboard support
document.addEventListener('keydown', (e) => {
    const key = e.key;
    if (/[0-9.]/.test(key)) appendChar(key);
    if (['+', '-', '*', '/'].includes(key)) appendChar(key);
    if (key === 'Enter') calculate();
    if (key === 'Backspace') backspace();
    if (key === 'Escape') clearDisplay();
});