/**
 * Government & Application Tools Presets
 * Defines file requirements for various Indian government portals.
 */

export const GovPresets = {
    PAN: {
        PHOTO: {
            title: "PAN Photo",
            maxSizeKB: 50,
            format: "image/jpeg",
            width: 213,  // approx 3.5cm at 200dpi
            height: 213, // approx 2.5cm is different, usually 3.5x2.5cm 
            // NSDL/UTIITSL usually says 3.5cm x 2.5cm, 
            // but let's stick to size priority first, allow crop
            aspectRatio: 3.5 / 2.5,
            dpi: 200
        },
        SIGNATURE: {
            title: "PAN Signature",
            maxSizeKB: 20,
            format: "image/jpeg",
            width: 400, // flexible width
            height: 200,
            aspectRatio: 4.5 / 2.0, // approx
        },
        DOCUMENT: {
            title: "PAN Document",
            maxSizeKB: 1024, // 1MB
            format: "application/pdf" // or jpeg allowed sometimes
        }
    },
    AADHAAR: {
        DOCUMENT: {
            title: "Aadhaar Document",
            maxSizeKB: 2048, // 2MB
            format: "application/pdf" // also jpg/png
        }
    },
    PASSPORT: {
        PHOTO: {
            title: "Passport Photo",
            minSizeKB: 20,
            maxSizeKB: 50, // very strict 20-50 range sometimes
            format: "image/jpeg",
            aspectRatio: 1, // often square or 3.5x4.5 depending on portal
            // For Indian Passport Seva: 3.5cm x 4.5cm
            width: 350,
            height: 450
        },
        SIGNATURE: {
            title: "Passport Signature",
            maxSizeKB: 20,
            format: "image/jpeg"
        }
    },
    EXAM: {
        SSC: {
            PHOTO: { maxSizeKB: 50, minSizeKB: 20 },
            SIGN: { maxSizeKB: 20, minSizeKB: 10 }
        },
        UPSC: {
            PHOTO: { maxSizeKB: 300, minSizeKB: 20 }, // varies yearly, keeping safe generic
            SIGN: { maxSizeKB: 20, minSizeKB: 10 } // often very small
        }
    }
};

export const FormatLabels = {
    "image/jpeg": "JPG",
    "image/png": "PNG",
    "application/pdf": "PDF"
};
