const Team = require("../models/Team");
const User = require("../models/User");

// List all players (TeamManager only)
const listPlayers = async (req, res) => {
    try {
        const players = await User.find({ role: "Player" });
        res.json(players);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Create a new team (TeamManager only)
const createTeam = async (req, res) => {
    const { teamName } = req.body;
    const mgrId = req.user.userId;
    try {
        if (req.user.role !== "TeamManager") {
            return res.status(403).json({ message: "Admins or Team Managers only" });
        }
        const team = await Team.create({
            teamName,
            captain: mgrId,
            members: [mgrId],
        });
        // Update the User document
        await User.findByIdAndUpdate(mgrId, { team: team._id });
        res.status(201).json(team);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get my team (for both TeamManager and Player)
const getMyTeam = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user.team) {
            return res.status(404).json({ message: "No team assigned" });
        }
        const team = await Team.findById(user.team).populate("members", "username email");
        res.json(team);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Add member to team (TeamManager only)
const addMember = async (req, res) => {
    const { teamId } = req.params;
    const { userId } = req.body; // player to add
    try {
        if (req.user.role !== "TeamManager") {
            return res.status(403).json({ message: "Admins or Team Managers only" });
        }
        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ message: "Team not found" });
        if (team.captain.toString() !== req.user.userId) {
            return res.status(403).json({ message: "Only your own team" });
        }
        const player = await User.findById(userId);
        if (!player || player.role !== "Player") {
            return res.status(400).json({ message: "Can only add Players" });
        }
        if (team.members.includes(userId)) {
            return res.status(400).json({ message: "Already a member" });
        }
        team.members.push(userId);
        await team.save();
        player.team = teamId;
        await player.save();
        res.json(team);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Remove member (TeamManager only)
const removeMember = async (req, res) => {
    const { teamId, userId } = req.params;
    try {
        if (req.user.role !== "TeamManager") {
            return res.status(403).json({ message: "Admins or Team Managers only" });
        }
        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ message: "Team not found" });
        if (team.captain.toString() !== req.user.userId) {
            return res.status(403).json({ message: "Only your own team" });
        }
        team.members = team.members.filter((m) => m.toString() !== userId);
        await team.save();
        const player = await User.findById(userId);
        if (player) {
            player.team = undefined;
            await player.save();
        }
        res.json(team);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Leave team (Player only)
const leaveTeam = async (req, res) => {
    const userId = req.user.userId;
    try {
        const user = await User.findById(userId);
        if (!user.team) return res.status(400).json({ message: "Not in a team" });
        const team = await Team.findById(user.team);
        team.members = team.members.filter((m) => m.toString() !== userId);
        await team.save();
        user.team = undefined;
        await user.save();
        res.json({ message: "Left the team" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    listPlayers,
    createTeam,
    getMyTeam,
    addMember,
    removeMember,
    leaveTeam,
};
