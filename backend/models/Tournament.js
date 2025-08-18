const mongoose = require("mongoose");

const BRACKETS = ["Single Elimination", "Double Elimination", "Round Robin"];
const STATUSES = ["Upcoming", "Live", "Completed"];

const tournamentSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        game: { type: String, required: true, trim: true },

        // SRS format (aka bracket)
        bracket: { type: String, enum: BRACKETS, default: "Single Elimination" },

        // Dates
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        registrationDeadline: { type: Date, required: true },

        // Capacity (0 disables that mode)
        playerLimit: { type: Number, default: 0, min: 0 },
        teamLimit: { type: Number, default: 0, min: 0 },

        // Lifecycle
        status: { type: String, enum: STATUSES, default: "Upcoming" },
        registrationOpen: { type: Boolean, default: true }, // Admin toggle

        // Registrations
        soloPlayers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
        teams: [{ type: mongoose.Schema.Types.ObjectId, ref: "Team", default: [] }],

        // Optional metadata
        description: { type: String, default: "" },
        rules: { type: String, default: "" },
        location: { type: String, default: "" }, // region/venue/server
        prizePool: { type: String, default: "" },
        entryFee: { type: String, default: "" },

        // Bracket (generated via #7 special logic)
        bracketData: { type: Object, default: null }, // { participants, rounds, generatedAt, method }

        // Light audit
        lastRegistrationActionBy: { type: String, default: "" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Tournament", tournamentSchema);
