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
        // place images/videos into separate subfolders so controller URLs match (/uploads/images/... or /uploads/videos/...)
        const isImage = /^image\//i.test(file.mimetype);
        const sub = isImage ? "images" : "videos";
        const dir = path.join(UPLOAD_ROOT, sub);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
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
