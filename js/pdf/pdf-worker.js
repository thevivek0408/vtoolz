importScripts('../../js/vendor/pdf-lib.min.js');

// Helper to handle messages
self.onmessage = async function (e) {
    const { type, payload, id } = e.data;
    try {
        let result;
        switch (type) {
            case 'MERGE_PDFS':
                result = await mergePdfs(payload.files);
                break;
            case 'SPLIT_PDF':
                result = await splitPdf(payload.file, payload.ranges);
                break;
            case 'ROTATE_PDF':
                result = await rotatePdf(payload.file, payload.degrees, payload.pages);
                break;
            case 'REVERSE_PDF':
                result = await reversePdf(payload.file);
                break;
            case 'DELETE_PAGES':
                result = await deletePages(payload.file, payload.pages);
                break;
            case 'EXTRACT_PAGES':
                result = await extractPages(payload.file, payload.pages);
                break;
            case 'FLATTEN_PDF':
                result = await flattenPdf(payload.file);
                break;
            case 'WATERMARK_PDF':
                result = await watermarkPdf(payload.file, payload.text, payload.options);
                break;
            case 'IMAGES_TO_PDF':
                result = await imagesToPdf(payload.images, payload.options);
                break;
            default:
                throw new Error(`Unknown operation: ${type}`);
        }
        self.postMessage({ type: 'SUCCESS', id, result });
    } catch (error) {
        self.postMessage({ type: 'ERROR', id, error: error.message });
    }
};

async function mergePdfs(fileBuffers) {
    const { PDFDocument } = PDFLib;
    const mergedPdf = await PDFDocument.create();

    for (const buffer of fileBuffers) {
        const pdf = await PDFDocument.load(buffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
    }
    const pdfBytes = await mergedPdf.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
}

async function splitPdf(fileBuffer, ranges) {
    // ranges: "1-5, 8, 11-13" string or array of arrays? 
    // Implementing "Split by ranges" where each range becomes a separate PDF? 
    // Or just extracting specific pages to a NEW PDF (which is Extract).
    // The requirement says "Split PDF (range + single)". Usually means "Extract these pages to a new PDF".
    // If it means "Explode into single pages", that's different.
    // Let's assume input is "pages to keep for the new PDF".
    // Reusing extractPages for this context.
    return extractPages(fileBuffer, ranges);
}

async function extractPages(fileBuffer, pageIndices) {
    const { PDFDocument } = PDFLib;
    const srcPdf = await PDFDocument.load(fileBuffer);
    const newPdf = await PDFDocument.create();

    // pageIndices should be 0-based array of integers
    const copiedPages = await newPdf.copyPages(srcPdf, pageIndices);
    copiedPages.forEach((page) => newPdf.addPage(page));

    const pdfBytes = await newPdf.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
}

async function rotatePdf(fileBuffer, degrees, pageIndices) {
    const { PDFDocument, degrees: deg } = PDFLib;
    const pdfDoc = await PDFDocument.load(fileBuffer);
    const pages = pdfDoc.getPages();

    // If pageIndices is empty/null, rotate all
    const indicesToRotate = pageIndices || pages.map((_, i) => i);

    indicesToRotate.forEach(idx => {
        if (pages[idx]) {
            const currentRotation = pages[idx].getRotation().angle;
            pages[idx].setRotation(deg(currentRotation + degrees));
        }
    });

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
}

async function watermarkPdf(fileBuffer, text, options = {}) {
    const { PDFDocument, rgb, degrees } = PDFLib;
    const pdfDoc = await PDFDocument.load(fileBuffer);
    const pages = pdfDoc.getPages();

    // Options: opacity (0-1), size, rotation, color?
    // Simplified for now: Center, 45 deg, Red/Grey?

    const fontSize = 50;
    const opacity = options.opacity || 0.5;

    pages.forEach(page => {
        const { width, height } = page.getSize();
        page.drawText(text, {
            x: width / 2 - (text.length * fontSize / 4), // Rough center
            y: height / 2,
            size: fontSize,
            color: rgb(0.8, 0.2, 0.2), // Reddish
            opacity: opacity,
            rotate: degrees(45),
        });
    });

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
}

async function reversePdf(fileBuffer) {
    const { PDFDocument } = PDFLib;
    const srcPdf = await PDFDocument.load(fileBuffer);
    const newPdf = await PDFDocument.create();

    const count = srcPdf.getPageCount();
    const indices = Array.from({ length: count }, (_, i) => count - 1 - i);

    const copiedPages = await newPdf.copyPages(srcPdf, indices);
    copiedPages.forEach((page) => newPdf.addPage(page));

    const pdfBytes = await newPdf.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
}

async function deletePages(fileBuffer, pagesToDelete) {
    const { PDFDocument } = PDFLib;
    const pdfDoc = await PDFDocument.load(fileBuffer);
    const count = pdfDoc.getPageCount();

    // Create new PDF and copy only pages NOT in pagesToDelete
    const newPdf = await PDFDocument.create();
    const pagesToKeep = [];

    for (let i = 0; i < count; i++) {
        if (!pagesToDelete.includes(i)) {
            pagesToKeep.push(i);
        }
    }

    const copiedPages = await newPdf.copyPages(pdfDoc, pagesToKeep);
    copiedPages.forEach((page) => newPdf.addPage(page));

    const pdfBytes = await newPdf.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
}

async function imagesToPdf(imageBuffers, options = {}) {
    const { PDFDocument, PageSizes } = PDFLib;
    const pdfDoc = await PDFDocument.create();

    for (const buffer of imageBuffers) {
        let image;
        try {
            const u8 = new Uint8Array(buffer);
            if (u8[0] === 0x89 && u8[1] === 0x50 && u8[2] === 0x4E && u8[3] === 0x47) {
                image = await pdfDoc.embedPng(buffer);
            } else {
                image = await pdfDoc.embedJpg(buffer);
            }
        } catch (e) {
            console.warn("Skipping invalid image", e);
            continue;
        }

        let page;
        if (options.pageSize === 'A4') {
            page = pdfDoc.addPage(PageSizes.A4);
            const { width, height } = page.getSize();
            const margin = options.margin || 20;
            const maxWidth = width - (margin * 2);
            const maxHeight = height - (margin * 2);

            // Scale image to fit
            const imgDims = image.scaleToFit(maxWidth, maxHeight);

            page.drawImage(image, {
                x: (width - imgDims.width) / 2, // Center X
                y: (height - imgDims.height) / 2, // Center Y
                width: imgDims.width,
                height: imgDims.height,
            });

        } else {
            // Use image size
            page = pdfDoc.addPage([image.width, image.height]);
            page.drawImage(image, {
                x: 0,
                y: 0,
                width: image.width,
                height: image.height,
            });
        }
    }

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
}
