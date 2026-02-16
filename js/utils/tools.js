export const tools = [
    // PDF Tools
    { id: 'pdf-merge', name: 'Merge PDF', category: 'pdf', url: 'tools/pdf/merge.html', description: 'Combine multiple PDFs into one.', icon: 'fas fa-file-pdf', color: '#e74c3c', keywords: 'join binder combine' },
    { id: 'pdf-split', name: 'Split PDF', category: 'pdf', url: 'tools/pdf/split.html', description: 'Separate PDF pages.', icon: 'fas fa-cut', color: '#e74c3c', keywords: 'cut separate page' },
    { id: 'pdf-compress', name: 'Compress PDF', category: 'pdf', url: 'tools/pdf/compress.html', description: 'Reduce PDF file size.', icon: 'fas fa-compress-arrows-alt', color: '#e74c3c', keywords: 'shrink size optimize' },
    { id: 'pdf-conv-img', name: 'PDF to Image', category: 'pdf', url: 'tools/pdf/pdf-to-jpg.html', description: 'Convert pages to JPG/PNG.', icon: 'fas fa-image', color: '#e74c3c', keywords: 'convert jpg png' },
    { id: 'pdf-conv-pdf', name: 'Image to PDF', category: 'pdf', url: 'tools/pdf/jpg-to-pdf.html', description: 'Convert images to PDF.', icon: 'fas fa-file-image', color: '#e74c3c', keywords: 'create make photos' },
    { id: 'pdf-watermark', name: 'Watermark PDF', category: 'pdf', url: 'tools/pdf/watermark.html', description: 'Add text/image stamp.', icon: 'fas fa-stamp', color: '#e74c3c', keywords: 'stamp logo protect' },
    { id: 'pdf-duplicate', name: 'Duplicate Pages', category: 'pdf', url: 'tools/pdf/duplicate.html', description: 'Clone specific pages.', icon: 'fas fa-copy', color: '#e74c3c', keywords: 'clone repeat' },

    // Image Tools
    { id: 'img-compress', name: 'Compress Image', category: 'image', url: 'tools/image/compress.html', description: 'Shrink JPG/PNG/WEBP.', icon: 'fas fa-compress', color: '#3498db', keywords: 'shrink tiny optimize' },
    { id: 'img-editor', name: 'Photo Editor', category: 'image', url: 'tools/image/editor.html', description: 'Crop, Filter, Draw.', icon: 'fas fa-edit', color: '#3498db', keywords: 'photoshop modify adjust' },
    { id: 'img-resize', name: 'Resize Image', category: 'image', url: 'tools/image/resize.html', description: 'Change dimensions.', icon: 'fas fa-expand', color: '#3498db', keywords: 'scale dimension' },
    { id: 'img-convert', name: 'Convert Image', category: 'image', url: 'tools/image/convert.html', description: 'Switch format (JPG/PNG).', icon: 'fas fa-exchange-alt', color: '#3498db', keywords: 'format switch' },
    { id: 'img-meme', name: 'Meme Generator', category: 'image', url: 'tools/image/meme-generator.html', description: 'Create funny memes.', icon: 'fas fa-laugh-squint', color: '#3498db', keywords: 'caption text funny' },
    { id: 'img-bg', name: 'BG Remover', category: 'media', url: 'tools/media/bg-remover.html', description: 'Remove backgrounds AI.', icon: 'fas fa-eraser', color: '#e91e63', keywords: 'transparent remove background' },

    // Text Tools
    { id: 'txt-counter', name: 'Word Counter', category: 'text', url: 'tools/text/counter.html', description: 'Count words & chars.', icon: 'fas fa-calculator', color: '#2ecc71', keywords: 'length stats' },
    { id: 'txt-case', name: 'Case Converter', category: 'text', url: 'tools/text/case-converter.html', description: 'UPPER, lower, Title.', icon: 'fas fa-text-height', color: '#2ecc71', keywords: 'capital transform' },
    { id: 'txt-lorem', name: 'Lorem Ipsum', category: 'text', url: 'tools/text/lorem.html', description: 'Generate placeholder text.', icon: 'fas fa-paragraph', color: '#2ecc71', keywords: 'dummy text generator' },
    { id: 'txt-diff', name: 'Diff Checker', category: 'text', url: 'tools/text/diff.html', description: 'Compare two texts.', icon: 'fas fa-columns', color: '#2ecc71', keywords: 'compare difference changes' },
    { id: 'txt-tts', name: 'Text to Speech', category: 'text', url: 'tools/text/tts.html', description: 'Read text aloud.', icon: 'fas fa-volume-up', color: '#2ecc71', keywords: 'speak audio voice' },

    // Dev Tools
    { id: 'dev-json', name: 'JSON Formatter', category: 'dev', url: 'tools/dev/json-formatter.html', description: 'Prettify/Minify JSON.', icon: 'fas fa-code', color: '#f39c12', keywords: 'lint beautify' },
    { id: 'dev-regex', name: 'Regex Tester', category: 'dev', url: 'tools/dev/regex.html', description: 'Test regular expressions.', icon: 'fas fa-vial', color: '#f39c12', keywords: 'match pattern' },
    { id: 'dev-qr', name: 'QR Generator', category: 'dev', url: 'tools/qr/index.html', description: 'Create QR Codes.', icon: 'fas fa-qrcode', color: '#34495e', keywords: 'barcode scan' },
    { id: 'dev-hash', name: 'Hash Generator', category: 'dev', url: 'tools/dev/hash.html', description: 'MD5, SHA-256.', icon: 'fas fa-fingerprint', color: '#f39c12', keywords: 'crypto security' },
    { id: 'dev-base64', name: 'Base64 Encode', category: 'dev', url: 'tools/dev/base64.html', description: 'Encode/Decode text.', icon: 'fas fa-shield-alt', color: '#f39c12', keywords: 'convert string' },
    { id: 'dev-resume', name: 'Resume Builder', category: 'dev', url: 'tools/dev/resume-builder.html', description: 'Build CV with Markdown.', icon: 'fas fa-file-invoice', color: '#ff5722', keywords: 'cv job application' },

    // Govt & Utility
    { id: 'govt-photo', name: 'Passport Photo', category: 'govt', url: 'tools/government/passport-photo.html', description: 'Crop for official docs.', icon: 'fas fa-user-circle', color: '#9c27b0', keywords: 'india size visa' },
    { id: 'util-wifi', name: 'Wi-Fi QR', category: 'utility', url: 'tools/utility/wifi-qr.html', description: 'Share Wi-Fi easily.', icon: 'fas fa-wifi', color: '#9c27b0', keywords: 'network internet' },
    { id: 'util-screen', name: 'Screen Recorder', category: 'media', url: 'tools/media/screen-recorder.html', description: 'Record screen & mic.', icon: 'fas fa-video', color: '#e91e63', keywords: 'capture video' },
    { id: 'util-voice', name: 'Voice Recorder', category: 'media', url: 'tools/media/voice-recorder.html', description: 'Record audio/mp3.', icon: 'fas fa-microphone', color: '#e91e63', keywords: 'sound mic' },
    { id: 'util-audio', name: 'Audio Trimmer', category: 'media', url: 'tools/media/audio-trimmer.html', description: 'Cut MP3/WAV files.', icon: 'fas fa-cut', color: '#e91e63', keywords: 'music sound edit' },

    // Games
    { id: 'game-hub', name: 'Game Arcade', category: 'fun', url: 'games/index.html', description: 'Play offline games.', icon: 'fas fa-gamepad', color: '#ffeb3b', keywords: 'play fun 2048' },
    { id: 'fun-decision', name: 'Decision Wheel', category: 'fun', url: 'tools/fun/decision-maker.html', description: 'Spin the wheel.', icon: 'fas fa-dharmachakra', color: '#ffeb3b', keywords: 'random choice' },
];
