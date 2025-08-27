const mongoose = require("mongoose");

const ROLES = ["Admin", "TeamManager", "Player", "Sponsor", "Partner"];

const userSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, trim: true, unique: true },
        email: { type: String, required: true, trim: true, unique: true },
        password: { type: String, required: true },
        role: { type: String, enum: ROLES, default: "Player" },
        country: String,
        team: String,
        profilePic: String,
        stats: { kdr: Number, winRate: String },
        tournaments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tournament" }],
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
module.exports.ROLES = ROLES;
