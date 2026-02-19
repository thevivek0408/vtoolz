import { Utils } from '../utils/common.js';

document.addEventListener('DOMContentLoaded', () => {
    const markdownInput = document.getElementById('markdown-input');
    const resumePreview = document.getElementById('resume-preview');
    const btnPrint = document.getElementById('btn-print');

    // Default Template Content
    const defaultResume = `# John Doe
**Software Engineer**
*New York, NY | +1-202-555-0149 | john.doe@email.com*

## Summary
Passionate software engineer with 5+ years of experience in building scalable web applications. Expert in JavaScript, React, and Node.js.

## Experience

### Senior Developer | Tech Corp
*Jan 2020 - Present*
- Led a team of 5 developers to launch the new e-commerce platform.
- Improved site performance by 40% through code optimization.
- Mentored junior developers and conducted code reviews.

### Web Developer | StartUp Inc
*Jun 2017 - Dec 2019*
- Developed responsive front-end interfaces using React and Redux.
- Collaborated with designers to implement pixel-perfect UIs.

## Education

### B.S. Computer Science | University of Tech
*2013 - 2017*
- Graduated with Honors (3.8 GPA)

## Skills
- **Languages:** JavaScript, Python, Java
- **Frameworks:** React, Node.js, Express
- **Tools:** Git, Docker, AWS
`;

    // Load form LocalStorage or use Default
    const saved = localStorage.getItem('vtoolz_resume_draft');
    if (saved) {
        markdownInput.value = saved;
    } else {
        markdownInput.value = defaultResume;
    }

    // Render Function
    function render() {
        const text = markdownInput.value;

        // Save (Auto-save)
        localStorage.setItem('vtoolz_resume_draft', text);

        // Parse Markdown using Marked.js (Global from <script> tag)
        // Configure marked to handle line breaks better if needed
        if (window.marked) {
            const rawHtml = window.marked.parse(text);
            resumePreview.innerHTML = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(rawHtml) : rawHtml;
        } else {
            resumePreview.innerHTML = "<p style='color:red'>Error: Marked.js library not loaded.</p>";
        }
    }

    // Event Listeners
    markdownInput.addEventListener('input', render);

    btnPrint.addEventListener('click', () => {
        window.print();
    });

    // Theme Switching (Simple CSS Class Toggle)
    document.getElementById('btn-template-simple').addEventListener('click', () => {
        resumePreview.className = "resume-page theme-simple";
        Utils.showToast("Applied Simple Theme", "info");
    });

    document.getElementById('btn-template-modern').addEventListener('click', () => {
        resumePreview.className = "resume-page theme-modern";
        Utils.showToast("Applied Modern Theme", "info");
    });

    // Initial Render
    render();
});
