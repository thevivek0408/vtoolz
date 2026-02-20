(() => {
    const FORBIDDEN_TOKENS = [';', '{', '}', '=>', '='];

    const isQuoted = (value) => {
        if (!value || value.length < 2) return false;
        const first = value[0];
        const last = value[value.length - 1];
        return (first === '"' && last === '"') || (first === "'" && last === "'");
    };

    const parseStringLiteral = (value) => {
        if (!isQuoted(value)) return value;
        const quote = value[0];
        let result = '';
        for (let index = 1; index < value.length - 1; index += 1) {
            const char = value[index];
            if (char === '\\' && index + 1 < value.length - 1) {
                const next = value[index + 1];
                if (next === quote || next === '\\') {
                    result += next;
                    index += 1;
                    continue;
                }
                if (next === 'n') {
                    result += '\n';
                    index += 1;
                    continue;
                }
            }
            result += char;
        }
        return result;
    };

    const splitTopLevel = (value, delimiter) => {
        const parts = [];
        let current = '';
        let depthParen = 0;
        let depthBracket = 0;
        let inSingle = false;
        let inDouble = false;

        for (let index = 0; index < value.length; index += 1) {
            const char = value[index];
            const prev = index > 0 ? value[index - 1] : '';

            if (char === "'" && !inDouble && prev !== '\\') {
                inSingle = !inSingle;
                current += char;
                continue;
            }
            if (char === '"' && !inSingle && prev !== '\\') {
                inDouble = !inDouble;
                current += char;
                continue;
            }
            if (inSingle || inDouble) {
                current += char;
                continue;
            }

            if (char === '(') depthParen += 1;
            if (char === ')') depthParen -= 1;
            if (char === '[') depthBracket += 1;
            if (char === ']') depthBracket -= 1;

            if (char === delimiter && depthParen === 0 && depthBracket === 0) {
                parts.push(current.trim());
                current = '';
                continue;
            }
            current += char;
        }

        if (current.trim().length > 0) {
            parts.push(current.trim());
        }
        return parts;
    };

    const findTopLevelBinary = (value) => {
        let depthParen = 0;
        let depthBracket = 0;
        let inSingle = false;
        let inDouble = false;

        for (let index = 0; index < value.length; index += 1) {
            const char = value[index];
            const prev = index > 0 ? value[index - 1] : '';
            if (char === "'" && !inDouble && prev !== '\\') inSingle = !inSingle;
            if (char === '"' && !inSingle && prev !== '\\') inDouble = !inDouble;
            if (inSingle || inDouble) continue;

            if (char === '(') depthParen += 1;
            else if (char === ')') depthParen -= 1;
            else if (char === '[') depthBracket += 1;
            else if (char === ']') depthBracket -= 1;

            if (depthParen !== 0 || depthBracket !== 0) continue;
            if ((char === '+' || char === '-') && index > 0) {
                return { operator: char, index };
            }
        }

        return null;
    };

    const resolveRoot = (identifier, element, event) => {
        if (identifier === 'this') return element;
        if (identifier === 'event') return event;
        if (identifier === 'window') return window;
        if (identifier === 'document') return document;
        if (identifier === 'location') return window.location;
        if (identifier === 'localStorage') return window.localStorage;
        if (identifier === 'Math') return window.Math;
        return window[identifier];
    };

    const parsePathSegments = (path) => {
        const segments = [];
        let index = 0;
        let token = '';

        const pushToken = () => {
            if (token) {
                segments.push({ type: 'property', value: token });
                token = '';
            }
        };

        while (index < path.length) {
            const char = path[index];
            if (char === '.') {
                pushToken();
                index += 1;
                continue;
            }
            if (char === '[') {
                pushToken();
                const closeIndex = path.indexOf(']', index);
                if (closeIndex === -1) throw new Error('Invalid bracket accessor');
                const content = path.slice(index + 1, closeIndex).trim();
                segments.push({ type: 'index', value: content });
                index = closeIndex + 1;
                continue;
            }
            token += char;
            index += 1;
        }

        pushToken();
        return segments;
    };

    const parseCall = (expression) => {
        const firstOpen = expression.indexOf('(');
        const lastClose = expression.lastIndexOf(')');
        if (firstOpen <= 0 || lastClose !== expression.length - 1) {
            throw new Error('Expression must be a function call');
        }
        const callee = expression.slice(0, firstOpen).trim();
        const args = expression.slice(firstOpen + 1, lastClose).trim();
        return { callee, args: args ? splitTopLevel(args, ',') : [] };
    };

    const resolveValue = (raw, element, event) => {
        const value = raw.trim();
        if (value === '') return undefined;
        if (value === 'null') return null;
        if (value === 'true') return true;
        if (value === 'false') return false;
        if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
        if (isQuoted(value)) return parseStringLiteral(value);

        const binary = findTopLevelBinary(value);
        if (binary) {
            const left = resolveValue(value.slice(0, binary.index), element, event);
            const right = resolveValue(value.slice(binary.index + 1), element, event);
            if (binary.operator === '+') return left + right;
            return left - right;
        }

        return resolvePath(value, element, event).value;
    };

    const resolvePath = (path, element, event) => {
        const segments = parsePathSegments(path);
        if (segments.length === 0 || segments[0].type !== 'property') {
            throw new Error('Invalid expression path');
        }

        let parent = null;
        let current = resolveRoot(segments[0].value, element, event);
        if (typeof current === 'undefined') {
            throw new Error(`Unknown identifier: ${segments[0].value}`);
        }

        for (let index = 1; index < segments.length; index += 1) {
            const segment = segments[index];
            parent = current;
            if (segment.type === 'property') {
                current = current?.[segment.value];
            } else {
                const indexValue = resolveValue(segment.value, element, event);
                current = current?.[indexValue];
            }
        }

        return { value: current, context: parent ?? window };
    };

    const run = (code, element, event) => {
        if (!code) return;
        if (FORBIDDEN_TOKENS.some((token) => code.includes(token))) {
            console.warn('Unsupported data-on* expression skipped:', code);
            return;
        }

        try {
            const { callee, args } = parseCall(code.trim());
            const target = resolvePath(callee, element, event);
            if (typeof target.value !== 'function') {
                throw new Error('Handler target is not callable');
            }
            const argValues = args.map((arg) => resolveValue(arg, element, event));
            target.value.apply(target.context, argValues);
        } catch (error) {
            console.error('Event handler error:', error);
        }
    };

    document.addEventListener('click', (event) => {
        const element = event.target.closest('[data-onclick]');
        if (!element) return;
        run(element.getAttribute('data-onclick'), element, event);
    });

    document.addEventListener('change', (event) => {
        const element = event.target.closest('[data-onchange]');
        if (!element) return;
        run(element.getAttribute('data-onchange'), element, event);
    });
})();
