const mongoose = require("mongoose");
const Tournament = require("../models/Tournament");
const Team = require("../models/Team");
const User = require("../models/User");

// Admin-only: Create Tournament
const createTournament = async (req, res) => {
    try {
        const { title, game, format, startDate, endDate, maxPlayers } = req.body;
        if (!title || !game || !format || !startDate || !endDate || !maxPlayers) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const t = new Tournament({
            title,
            game,
            format,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            maxPlayers,
            status: "upcoming",
            createdBy: req.user.userId
        });
        await t.save();
        res.status(201).json(t);
    } catch (err) {
        console.error("Create tournament error:", err);
        res.status(500).json({ message: "Failed to create tournament" });
    }
};

// Public: Get All Tournaments
const getAllTournaments = async (req, res) => {
    try {
        const list = await Tournament.find().sort({ startDate: 1 });
        res.json(list);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch tournaments" });
    }
};

// Admin-only update
const updateTournament = async (req, res) => {
    try {
        const updated = await Tournament.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updated) return res.status(404).json({ message: "Not found" });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Admin-only delete
const deleteTournament = async (req, res) => {
    try {
        const deleted = await Tournament.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Not found" });
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Register a solo player
const registerSolo = async (req, res) => {
    const tourId = req.params.id;
    const userId = req.user.userId;

    try {
        // 1) add user to tournament
        const result = await Tournament.collection.updateOne(
            { _id: new mongoose.Types.ObjectId(tourId) },
            { $addToSet: { soloPlayers: new mongoose.Types.ObjectId(userId) } }
        );
        if (result.matchedCount === 0)
            return res.status(404).json({ message: "Tournament not found" });

        // 2) add tournament to user
        await User.updateOne(
            { _id: new mongoose.Types.ObjectId(userId) },
            { $addToSet: { tournaments: new mongoose.Types.ObjectId(tourId) } }
        );

        return res.json({ message: "Solo registration successful" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
};

// Register a team
const registerTeam = async (req, res) => {
    const tourId = req.params.id;
    const userId = req.user.userId;

    try {
        // find the caller's team
        const team = await Team.findOne({ captain: userId }) ||
            await Team.findOne({ members: userId });
        if (!team)
            return res.status(400).json({ message: "You must be on a team" });

        // 1) add team to tournament
        const result = await Tournament.collection.updateOne(
            { _id: new mongoose.Types.ObjectId(tourId) },
            { $addToSet: { teams: team._id } }
        );
        if (result.matchedCount === 0)
            return res.status(404).json({ message: "Tournament not found" });

        // 2) add tournament to user
        await User.updateOne(
            { _id: new mongoose.Types.ObjectId(userId) },
            { $addToSet: { tournaments: new mongoose.Types.ObjectId(tourId) } }
        );

        return res.json({ message: "Team registration successful" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    createTournament,
    getAllTournaments,
    updateTournament,
    deleteTournament,
    registerSolo,
    registerTeam,
};
