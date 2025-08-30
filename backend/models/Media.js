// backend/models/Media.js
const mongoose = require("mongoose");

const MediaSchema = new mongoose.Schema(
    {
        tournament: { type: mongoose.Schema.Types.ObjectId, ref: "Tournament", required: true },
        matchId: { type: String, default: "" },            // e.g., "r=0&m=1"
        kind: { type: String, enum: ["video", "image"], required: true },

        title: { type: String, required: true },
        description: { type: String, default: "" },

        filePath: { type: String, default: "" },           // /uploads/images/... or /uploads/videos/...
        externalUrl: { type: String, default: "" },
        thumbnailUrl: { type: String, default: "" },

        category: { type: String, default: "General" },
        game: { type: String, default: "" },

        // ✅ keep as array of strings
        tags: [{ type: String }],

        visibility: { type: String, enum: ["Public", "Unlisted", "Private"], default: "Public" },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    },
    { timestamps: true }
);

// ---------- Indexes ---------- //
MediaSchema.index({ tournament: 1, kind: 1, createdAt: -1 });
MediaSchema.index({ matchId: 1, tournament: 1 });

// ✅ Text search only on title + description
MediaSchema.index({ title: "text", description: "text" });

// ✅ Normal index for tags (arrays are fine here)
MediaSchema.index({ tags: 1 });

module.exports = mongoose.model("Media", MediaSchema);
