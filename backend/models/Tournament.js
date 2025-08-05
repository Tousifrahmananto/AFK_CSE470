const mongoose = require("mongoose");

const tournamentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    game: { type: String, required: true },
    bracket: { type: String, default: "SingleElimination" },
    startDate: Date,
    endDate: Date,
    registrationDeadline: Date,
    playerLimit: Number,
    status: {
        type: String,
        enum: ["Upcoming", "Live", "Completed", "upcoming", "live", "completed"],
        default: "Upcoming"
    },

    // New:
    soloPlayers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    teams: [{ type: mongoose.Schema.Types.ObjectId, ref: "Team" }],
});

// ensure soloPlayers & teams default to []
tournamentSchema.path("soloPlayers").default(() => []);
tournamentSchema.path("teams").default(() => []);

module.exports = mongoose.model("Tournament", tournamentSchema);
