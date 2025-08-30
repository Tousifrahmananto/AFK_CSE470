// backend/controllers/mediaController.js
const path = require("path");
const Media = require("../models/Media");

// Helpers
const toTags = (v) =>
    Array.isArray(v) ? v : String(v || "").split(",").map(s => s.trim()).filter(Boolean);

const fileUrlFrom = (file) => {
    if (!file) return "";
    const isImage = /^image\//i.test(file.mimetype);
    const sub = isImage ? "images" : "videos";
    return `/uploads/${sub}/${file.filename}`;
};

/* ------------------------- Admin CRUD: Unified ------------------------- */
// POST /api/media (Admin)
// multipart single "file" (optional) + body: { kind, tournament, matchId?, title, description?, externalUrl?, ... }
exports.createMedia = async (req, res) => {
    try {
        console.log("createMedia called - user:", req.user && (req.user.userId || req.user.email), "file:", req.file && req.file.filename);
        const {
            kind, tournament, matchId = "", title, description = "",
            externalUrl = "", thumbnailUrl = "", category = "General", game = "", tags = "",
            visibility = "Public",
        } = req.body;

        if (!kind || !["video", "image"].includes(kind)) {
            return res.status(400).json({ message: "Invalid kind" });
        }
        if (!tournament || !title) {
            return res.status(400).json({ message: "tournament and title are required" });
        }

        const doc = await Media.create({
            kind, tournament, matchId, title, description,
            filePath: req.file ? fileUrlFrom(req.file) : "",
            externalUrl, thumbnailUrl, category, game, tags: toTags(tags),
            visibility, uploadedBy: req.user?.userId,
        });

        res.status(201).json(doc);
    } catch (err) {
        console.error("createMedia:", err && err.stack ? err.stack : err);
        res.status(500).json({ message: "Failed to create media" });
    }
};

// PUT /api/media/:id (Admin)
exports.updateMedia = async (req, res) => {
    try {
        const upd = { ...req.body };
        if (upd.tags && !Array.isArray(upd.tags)) upd.tags = toTags(upd.tags);
        if (req.file) upd.filePath = fileUrlFrom(req.file);

        const doc = await Media.findByIdAndUpdate(req.params.id, upd, { new: true });
        if (!doc) return res.status(404).json({ message: "Media not found" });
        res.json(doc);
    } catch (err) {
        console.error("updateMedia:", err);
        res.status(500).json({ message: "Failed to update media" });
    }
};

// DELETE /api/media/:id (Admin)
exports.deleteMedia = async (req, res) => {
    try {
        const doc = await Media.findByIdAndDelete(req.params.id);
        if (!doc) return res.status(404).json({ message: "Media not found" });
        res.json({ message: "Media deleted" });
    } catch (err) {
        console.error("deleteMedia:", err);
        res.status(500).json({ message: "Failed to delete media" });
    }
};

/* ----------------------------- Public List ----------------------------- */
// GET /api/media?kind=video|image&tournament=...&q=...&category=...
exports.listMedia = async (req, res) => {
    try {
        const { kind, tournament, category, game, q, matchId } = req.query;
        const filter = { visibility: "Public" };
        if (kind) filter.kind = kind;
        if (tournament) filter.tournament = tournament;
        if (category) filter.category = category;
        if (game) filter.game = new RegExp(`^${game}$`, "i");
        if (matchId) filter.matchId = matchId;
        if (q) {
            filter.$or = [
                { title: new RegExp(q, "i") },
                { description: new RegExp(q, "i") },
                { tags: new RegExp(q, "i") },
            ];
        }

        const items = await Media.find(filter)
            .populate({ path: "tournament", select: "title game startDate" })
            .populate({ path: "uploadedBy", select: "username role" })
            .sort({ createdAt: -1 })
            .lean();

        // If DB has no items, provide a lightweight fallback by scanning the uploads folder
        if (!items || items.length === 0) {
            try {
                const fs = require("fs");
                const path = require("path");
                const UP = path.join(__dirname, "..", "uploads");
                const files = [];
                if (fs.existsSync(UP)) {
                    // include files in root and subfolders images/ and videos/
                    const walk = (dir) => {
                        for (const f of fs.readdirSync(dir)) {
                            const full = path.join(dir, f);
                            const stat = fs.statSync(full);
                            if (stat.isDirectory()) {
                                walk(full);
                            } else {
                                files.push(full);
                            }
                        }
                    };
                    walk(UP);
                }

                const seen = files.map((p) => {
                    const relative = p.replace(path.join(__dirname, ".."), "").replace(/\\/g, "/");
                    const url = relative.startsWith("/uploads") ? relative : "/uploads" + relative;
                    const ext = path.extname(p).toLowerCase();
                    const isImage = [".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(ext);
                    const isVideo = [".mp4", ".webm", ".ogg", ".mov"].includes(ext);
                    const kindLocal = isVideo ? "video" : "image";
                    return {
                        _id: "file:" + path.basename(p),
                        title: path.basename(p),
                        description: "(file fallback)",
                        kind: kindLocal,
                        filePath: url,
                        externalUrl: "",
                        thumbnailUrl: "",
                        visibility: "Public",
                    };
                });

                return res.json(seen);
            } catch (e) {
                console.error("listMedia fallback error:", e);
            }
        }

        res.json(items);
    } catch (err) {
        console.error("listMedia:", err);
        res.status(500).json({ message: "Failed to fetch media" });
    }
};

/* --------------------- Per-Match (used by your UI) --------------------- */
// GET /api/tournaments/:id/matches/:r/:m/media (Public)
exports.listMatchMedia = async (req, res) => {
    try {
        const { id } = req.params;
        const r = Number(req.params.r);
        const m = Number(req.params.m);
        const matchId = `r=${r}&m=${m}`;

        const items = await Media.find({
            tournament: id,
            matchId,
            visibility: "Public",
        })
            .sort({ createdAt: -1 })
            .lean();

        const videos = items.filter(x => x.kind === "video").map(x => ({
            url: x.filePath || x.externalUrl,
            originalName: x.title,
            _id: x._id,
        }));
        const images = items.filter(x => x.kind === "image").map(x => ({
            url: x.filePath || x.externalUrl,
            originalName: x.title,
            _id: x._id,
        }));

        res.json({
            title: "", // optional: populate tournament title if you want
            media: { videos, images },
        });
    } catch (err) {
        console.error("listMatchMedia:", err);
        res.status(500).json({ message: "Failed to load match media" });
    }
};

// POST /api/tournaments/:id/matches/:r/:m/media (Admin)
// multipart: "files"[] + body.kind = video|image
exports.uploadMatchMedia = async (req, res) => {
    try {
        const { id } = req.params;
        const r = Number(req.params.r);
        const m = Number(req.params.m);
        const { kind } = req.body;
        if (!["video", "image"].includes(kind)) {
            return res.status(400).json({ message: "kind must be video or image" });
        }
        const matchId = `r=${r}&m=${m}`;

        const files = Array.isArray(req.files) ? req.files : [];
        if (!files.length) return res.status(400).json({ message: "No files uploaded" });

        const docs = await Media.insertMany(
            files.map((f) => ({
                kind,
                tournament: id,
                matchId,
                title: f.originalname,
                filePath: fileUrlFrom(f),
                visibility: "Public",
                uploadedBy: req.user?.userId,
            }))
        );

        const items = await Media.find({ tournament: id, matchId, visibility: "Public" })
            .sort({ createdAt: -1 }).lean();

        const videos = items.filter(x => x.kind === "video").map(x => ({ url: x.filePath || x.externalUrl, originalName: x.title, _id: x._id }));
        const images = items.filter(x => x.kind === "image").map(x => ({ url: x.filePath || x.externalUrl, originalName: x.title, _id: x._id }));

        res.status(201).json({ message: "Uploaded", media: { videos, images } });
    } catch (err) {
        console.error("uploadMatchMedia:", err);
        res.status(500).json({ message: "Failed to upload" });
    }
};

// DELETE /api/tournaments/:id/matches/:r/:m/media (Admin) body: { kind, url }
exports.deleteMatchMedia = async (req, res) => {
    try {
        const { id } = req.params;
        const r = Number(req.params.r);
        const m = Number(req.params.m);
        const { kind, url } = req.body || {};
        const matchId = `r=${r}&m=${m}`;

        if (!["video", "image"].includes(kind)) {
            return res.status(400).json({ message: "Invalid kind" });
        }
        if (!url) return res.status(400).json({ message: "url required" });

        const doc = await Media.findOneAndDelete({
            tournament: id,
            matchId,
            kind,
            $or: [{ filePath: url }, { externalUrl: url }],
        });

        if (!doc) return res.status(404).json({ message: "Item not found" });

        const items = await Media.find({ tournament: id, matchId, visibility: "Public" })
            .sort({ createdAt: -1 }).lean();

        const videos = items.filter(x => x.kind === "video").map(x => ({ url: x.filePath || x.externalUrl, originalName: x.title, _id: x._id }));
        const images = items.filter(x => x.kind === "image").map(x => ({ url: x.filePath || x.externalUrl, originalName: x.title, _id: x._id }));

        res.json({ message: "Removed", media: { videos, images } });
    } catch (err) {
        console.error("deleteMatchMedia:", err);
        res.status(500).json({ message: "Failed to remove media" });
    }
};
