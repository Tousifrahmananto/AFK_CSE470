// backend/utils/uploader.js
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const UPLOAD_ROOT = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOAD_ROOT)) {
    fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // keep everything under /uploads; you can subfolder by type if you prefer
        cb(null, UPLOAD_ROOT);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname || "");
        const base = path.basename(file.originalname || "file", ext);
        const safeBase = base.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\-]/g, "");
        cb(null, `${Date.now()}_${safeBase}${ext}`);
    },
});

const allowed = new Set([
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/quicktime",
]);

function fileFilter(req, file, cb) {
    if (allowed.has(file.mimetype)) return cb(null, true);
    cb(new Error("Unsupported file type"));
}

const uploader = multer({
    storage,
    fileFilter,
    limits: {
        // 200MB per file; adjust if needed
        fileSize: 200 * 1024 * 1024,
    },
});

// at the bottom of backend/utils/uploader.js
module.exports = uploader;        // default
module.exports.videoUpload = uploader; // named alias for routes expecting { videoUpload }
