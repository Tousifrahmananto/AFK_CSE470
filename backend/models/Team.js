const mongoose = require("mongoose");
const { Schema } = mongoose;

const socialsSchema = new Schema({
    website: { type: String, default: "" },
    discord: { type: String, default: "" },
    twitter: { type: String, default: "" },
    youtube: { type: String, default: "" },
}, { _id: false });

const teamSchema = new Schema({
    // existing
    teamName: { type: String, required: true, trim: true },
    captain: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],

    // SRS-aligned additions
    game: { type: String, required: true, trim: true },
    logoUrl: { type: String, default: "" },
    bio: { type: String, default: "", maxlength: 600 },
    region: { type: String, default: "" },
    socials: { type: socialsSchema, default: () => ({}) },
    maxMembers: { type: Number, default: 5, min: 1, max: 20 },
    visibility: { type: String, enum: ["public", "private"], default: "public" },
    status: { type: String, enum: ["active", "disbanded"], default: "active" },
}, { timestamps: true });

module.exports = mongoose.model("Team", teamSchema);
