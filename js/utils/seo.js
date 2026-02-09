/**
 * SEO & Meta Tag Injector
 * Auto-generates OpenGraph, Twitter Cards, and Schema from page content.
 */

(function initSEO() {
    const title = document.title;
    const description = document.querySelector('meta[name="description"]')?.content ||
        document.querySelector('h1')?.textContent + ' - Free, privacy-focused online tool.' ||
        'Free client-side tools for privacy.';
    const url = window.location.href;
    const image = 'https://vtoolz.pages.dev/assets/og-image.jpg'; // Placeholder

    // Function to set meta tag
    function setMeta(name, content, attribute = 'name') {
        let meta = document.querySelector(`meta[${attribute}="${name}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute(attribute, name);
            document.head.appendChild(meta);
        }
        meta.content = content;
    }

    // Standard Meta
    setMeta('description', description);
    setMeta('theme-color', '#2c3e50');

    // OpenGraph
    setMeta('og:title', title, 'property');
    setMeta('og:description', description, 'property');
    setMeta('og:url', url, 'property');
    setMeta('og:image', image, 'property');
    setMeta('og:type', 'website', 'property');

    // Twitter
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    setMeta('twitter:image', image);

    // JSON-LD Schema
    const schema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": title.split('-')[0].trim(), // "Merge PDF" from "Merge PDF - Privacy Tools"
        "description": description,
        "applicationCategory": "UtilitiesApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    console.log('SEO tags injected.');
})();
