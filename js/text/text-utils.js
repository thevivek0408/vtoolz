/**
 * Text Processing Utilities
 */

export const TextUtils = {
    // Counters
    countWords: (text) => text.trim() === '' ? 0 : text.trim().split(/\s+/).length,
    countChars: (text) => text.length,
    countCharsNoSpace: (text) => text.replace(/\s/g, '').length,
    countSentences: (text) => text.trim() === '' ? 0 : text.split(/[.!?]+/).filter(Boolean).length,
    countParagraphs: (text) => text.trim() === '' ? 0 : text.split(/\n\s*\n/).filter(Boolean).length,

    // Read time (avg 200 wpm)
    calculateReadTime: (text) => {
        const words = TextUtils.countWords(text);
        const minutes = words / 200;
        const seconds = Math.ceil(minutes * 60);
        return { minutes: Math.floor(minutes), seconds: seconds % 60, totalSeconds: seconds };
    },

    // Modifiers
    toCamelCase: (text) => text.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => index === 0 ? word.toLowerCase() : word.toUpperCase()).replace(/\s+/g, ''),
    toKebabCase: (text) => text && text.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g).map(x => x.toLowerCase()).join('-'),
    toSnakeCase: (text) => text && text.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g).map(x => x.toLowerCase()).join('_'),
    toTitleCase: (text) => text.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()),

    // Cleanup
    removeExtraSpaces: (text) => text.replace(/\s+/g, ' ').trim(),
    removeDuplicateLines: (text) => [...new Set(text.split('\n'))].join('\n'),
    sortLines: (text) => text.split('\n').sort().join('\n'),
    reverseLines: (text) => text.split('\n').reverse().join('\n'),

    // Find & Replace
    replaceAll: (text, search, replace) => text.split(search).join(replace)
};
