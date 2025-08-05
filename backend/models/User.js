const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 6 },
    role: {
        type: String,
        enum: ["Admin", "Player", "TeamManager"],
        default: "Player"
    },
    country: String,
    team: String,
    profilePic: String,
    stats: {
        kdr: Number,
        winRate: String
    },
    tournaments: [
        { type: mongoose.Schema.Types.ObjectId, ref: "Tournament" }
    ],

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
