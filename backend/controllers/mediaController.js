// backend/controllers/mediaController.js
const Video = require("../models/video.js");
const path = require("path");

// -------- VIDEOS --------
exports.createVideo = async (req, res) => {
    try {
        const {
            tournament, matchId, title, description,
            externalUrl = "", thumbnailUrl = "",
            category = "Full Match", game = "", tags = "",
            visibility = "Public",
        } = req.body;

        const payload = {
            tournament,
            matchId,
            title,
            description,
            externalUrl,
            thumbnailUrl,
            category,
            game,
            tags: Array.isArray(tags) ? tags : String(tags || "")
                .split(",").map(s => s.trim()).filter(Boolean),
            visibility,
            uploadedBy: req.user?.userId,
        };

        if (req.file) {
            payload.filePath = `/uploads/videos/${req.file.filename}`;
        }

        const doc = await (await Video.create(payload)).populate("tournament", "title");
        res.status(201).json(doc);
    } catch (err) {
        console.error("createVideo:", err);
        res.status(500).json({ message: "Failed to create video" });
    }
};

exports.updateVideo = async (req, res) => {
    try {
        const upd = { ...req.body };
        if (upd.tags && !Array.isArray(upd.tags)) {
            upd.tags = String(upd.tags).split(",").map(s => s.trim()).filter(Boolean);
        }
        if (req.file) upd.filePath = `/uploads/videos/${req.file.filename}`;

        const doc = await Video.findByIdAndUpdate(req.params.id, upd, { new: true });
        if (!doc) return res.status(404).json({ message: "Video not found" });
        res.json(doc);
    } catch (err) {
        console.error("updateVideo:", err);
        res.status(500).json({ message: "Failed to update video" });
    }
};

exports.deleteVideo = async (req, res) => {
    try {
        const doc = await Video.findByIdAndDelete(req.params.id);
        if (!doc) return res.status(404).json({ message: "Video not found" });
        res.json({ message: "Video deleted" });
    } catch (err) {
        console.error("deleteVideo:", err);
        res.status(500).json({ message: "Failed to delete video" });
    }
};

// Public list (only Public visibility)
exports.listVideos = async (req, res) => {
    try {
        const { tournament, game, category, q } = req.query;
        const filter = { visibility: "Public" };
        if (tournament) filter.tournament = tournament;
        if (game) filter.game = new RegExp(`^${game}$`, "i");
        if (category) filter.category = category;
        if (q) {
            filter.$or = [
                { title: new RegExp(q, "i") },
                { description: new RegExp(q, "i") },
                { tags: new RegExp(q, "i") },
            ];
        }
        const items = await Video.find(filter).sort({ createdAt: -1 }).lean();
        res.json(items);
    } catch (err) {
        console.error("listVideos:", err);
        res.status(500).json({ message: "Failed to fetch videos" });
    }
};
