const mongoose = require("mongoose");

/**
 * One document per player, per tournament, optionally per match.
 * We aggregate by userId for the leaderboard.
 */
const playerStatSchema = new mongoose.Schema(
  {
    tournament: { type: mongoose.Schema.Types.ObjectId, ref: "Tournament", required: true },
    user:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // optional match context (round/match index from bracketData)
    roundIndex: { type: Number, default: null },
    matchIndex: { type: Number, default: null },

    // simple FPS-style stats (expand as you like)
    kills:   { type: Number, default: 0 },
    deaths:  { type: Number, default: 0 },
    assists: { type: Number, default: 0 },
    score:   { type: Number, default: 0 }, // arbitrary “points” for ordering
  },
  { timestamps: true }
);

// helpful compound index
playerStatSchema.index({ tournament: 1, user: 1 });

module.exports = mongoose.model("PlayerStat", playerStatSchema);
