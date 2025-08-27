// backend/models/Team.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

/** Embedded socials object (no _id for subdoc) */
const socialsSchema = new Schema(
  {
    website: { type: String, default: "" },
    discord: { type: String, default: "" },
    twitter: { type: String, default: "" },
    youtube: { type: String, default: "" },
  },
  { _id: false }
);

const teamSchema = new Schema(
  {
    // Existing core fields
    teamName: { type: String, required: true, trim: true },
    captain: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],

    /**
     * SRS-aligned fields
     *
     * IMPORTANT: `game` is required only when the document is first created.
     * This prevents legacy teams (created before the field existed) from
     * failing validation on updates like add/remove member.
     */
    game: {
      type: String,
      required: function () {
        return this.isNew; // only on create
      },
      default: "N/A", // safe default for legacy docs
      trim: true,
    },

    logoUrl: { type: String, default: "" },
    bio: { type: String, default: "", maxlength: 600 },
    region: { type: String, default: "" },
    socials: { type: socialsSchema, default: () => ({}) },

    // Team size and visibility/status controls
    maxMembers: { type: Number, default: 5, min: 1, max: 20 },
    visibility: { type: String, enum: ["public", "private"], default: "public" },
    status: { type: String, enum: ["active", "disbanded"], default: "active" },
  },
  { timestamps: true }
);

// Helpful indexes (optional)
teamSchema.index({ teamName: 1 }, { unique: false });
teamSchema.index({ captain: 1 });

module.exports = mongoose.model("Team", teamSchema);
