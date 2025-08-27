// server/models/AdCampaign.js
const mongoose = require("mongoose");

const AdCampaignSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Sponsor/Partner/Admin
    // categories/placement
    category: { type: String, enum: ["Homepage", "Tournament", "Gallery", "Sidebar", "Header"], default: "Homepage" },
    gameFilter: { type: String, default: "" },     // optional target by game
    tournament: { type: mongoose.Schema.Types.ObjectId, ref: "Tournament", default: null }, // target specific
    // creative
    title: { type: String, required: true },
    imageUrl: { type: String, default: "" },       // hosted banner
    linkUrl: { type: String, default: "" },
    // flight
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ["Draft", "Active", "Paused", "Ended"], default: "Draft" },
    // measurements
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("AdCampaign", AdCampaignSchema);
