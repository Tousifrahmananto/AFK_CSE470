
const mongoose = require("mongoose");

const VideoSchema = new mongoose.Schema({
  tournament: { type: mongoose.Schema.Types.ObjectId, ref: "Tournament", required: true },
  matchId: { type: String, default: "" }, // optional external id
  title: { type: String, required: true },
  description: { type: String, default: "" },
  // Either upload a file (stored locally) OR use an external URL (YouTube/Twitch VOD)
  filePath: { type: String, default: "" },
  externalUrl: { type: String, default: "" },
  thumbnailUrl: { type: String, default: "" },
  category: { type: String, enum: ["Highlight", "Full Match", "Interview", "Recap"], default: "Full Match" },
  game: { type: String, default: "" },
  tags: [{ type: String }],
  visibility: { type: String, enum: ["Public", "Unlisted", "Private"], default: "Public" },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

module.exports = mongoose.model("Video", VideoSchema);
