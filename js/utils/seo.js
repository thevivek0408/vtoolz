/**
 * SEO & Meta Tag Injector
 * Auto-generates OpenGraph, Twitter Cards, and Schema from page content.
 */

(function initSEO() {
    const title = document.title;
    
    // Build a rich description from page content
    const existingDesc = document.querySelector('meta[name="description"]')?.content;
    const h1Text = document.querySelector('h1')?.textContent?.trim();
    const heroDesc = document.querySelector('.hero p, .tool-container p, main p')?.textContent?.trim();
    
    let description;
    if (existingDesc) {
        description = existingDesc;
    } else if (h1Text && heroDesc) {
        description = `${h1Text} - ${heroDesc} Free, private, no uploads.`;
    } else if (h1Text) {
        description = `${h1Text} - Free, privacy-focused online tool. 100% client-side, no uploads.`;
    } else {
        description = 'Vibox - Free client-side tools for privacy. No uploads, no tracking.';
    }

    // Trim to ~155 chars for optimal SEO
    if (description.length > 160) {
        description = description.substring(0, 157) + '...';
    }

    const url = window.location.href;
    const canonicalDomain = 'https://vibox.app';
    const image = canonicalDomain + '/assets/og-image.jpg';

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

    // Canonical URL (prevents duplicate content across vibox.app & github.io)
    if (!document.querySelector('link[rel="canonical"]')) {
        const canonical = document.createElement('link');
        canonical.rel = 'canonical';
        // Build canonical from path, always using the primary domain
        const path = window.location.pathname.replace(/^\/vtoolz/, '');
        canonical.href = canonicalDomain + path;
        document.head.appendChild(canonical);
    }
})();
