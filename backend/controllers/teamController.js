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


const createTeam = async (req, res) => {
    const {
        teamName,
        game,
        logoUrl = "",
        bio = "",
        region = "",
        socials = {},
        maxMembers = 5,
        visibility = "public",
        captainId,
        initialMembers = []
    } = req.body;

    const mgrId = req.user.userId;
    try {
        if (req.user.role !== "TeamManager") {
            return res.status(403).json({ message: "Admins or Team Managers only" });
        }
        if (!teamName || !game) {
            return res.status(400).json({ message: "teamName and game are required" });
        }

        const cap = Number(maxMembers);
        if (Number.isNaN(cap) || cap < 1 || cap > 20) {
            return res.status(400).json({ message: "maxMembers must be between 1 and 20" });
        }
        if (!["public", "private"].includes(visibility)) {
            return res.status(400).json({ message: "visibility must be 'public' or 'private'" });
        }

        let captain = mgrId;
        if (captainId) {
            const capUser = await User.findById(captainId);
            if (!capUser) return res.status(404).json({ message: "Captain not found" });
            if (!["Player", "TeamManager", "Admin"].includes(capUser.role)) {
                return res.status(400).json({ message: "Invalid captain role" });
            }
            captain = capUser._id;
        }

        const memberIds = Array.isArray(initialMembers) ? [...new Set(initialMembers.map(String))] : [];
        const filteredMemberIds = memberIds.filter(id => id !== String(captain));

        const players = filteredMemberIds.length
            ? await User.find({ _id: { $in: filteredMemberIds }, role: "Player" })
            : [];

        if (players.length !== filteredMemberIds.length) {
            return res.status(400).json({ message: "All initial members must be valid Players" });
        }

        const totalInitial = 1 + players.length;
        if (totalInitial > cap) {
            return res.status(400).json({ message: `Initial members exceed capacity (${cap})` });
        }

        const busy = await User.find({
            _id: { $in: [captain, ...players.map(p => p._id)] },
            team: { $ne: null, $exists: true }
        });
        if (busy.length > 0) {
            return res.status(400).json({ message: "Captain or a member is already in another team" });
        }

        const team = await Team.create({
            teamName,
            captain,
            members: [captain, ...players.map(p => p._id)],
            game,
            logoUrl,
            bio,
            region,
            socials: {
                website: socials.website || "",
                discord: socials.discord || "",
                twitter: socials.twitter || "",
                youtube: socials.youtube || ""
            },
            maxMembers: cap,
            visibility
        });

        await User.updateMany(
            { _id: { $in: [captain, ...players.map(p => p._id)] } },
            { $set: { team: team._id } }
        );

        const populated = await Team.findById(team._id)
            .populate("members", "username email role")
            .populate("captain", "username email role");

        res.status(201).json(populated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


const getMyTeam = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user.team) {
            return res.status(404).json({ message: "No team assigned" });
        }
        const team = await Team.findById(user.team)
            .populate("members", "username email role")
            .populate("captain", "username email role");
        res.json(team);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const addMember = async (req, res) => {
    const { teamId } = req.params;
    const { userId } = req.body;
    try {
        if (req.user.role !== "TeamManager") {
            return res.status(403).json({ message: "Admins or Team Managers only" });
        }
        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ message: "Team not found" });
        if (String(team.captain) !== req.user.userId) {
            return res.status(403).json({ message: "Only your own team" });
        }
        const player = await User.findById(userId);
        if (!player || player.role !== "Player") {
            return res.status(400).json({ message: "Can only add Players" });
        }
        if (player.team) {
            return res.status(400).json({ message: "Player already in a team" });
        }
        if (team.members.map(String).includes(String(userId))) {
            return res.status(400).json({ message: "Already a member" });
        }
        if (team.members.length >= team.maxMembers) {
            return res.status(400).json({ message: "Team is at capacity" });
        }
        team.members.push(userId);
        await team.save();
        player.team = teamId;
        await player.save();

        const updated = await Team.findById(teamId)
            .populate("members", "username email role")
            .populate("captain", "username email role");
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const removeMember = async (req, res) => {
    const { teamId, userId } = req.params;
    try {
        if (req.user.role !== "TeamManager") {
            return res.status(403).json({ message: "Admins or Team Managers only" });
        }
        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ message: "Team not found" });
        if (String(team.captain) !== req.user.userId) {
            return res.status(403).json({ message: "Only your own team" });
        }
        if (String(team.captain) === String(userId)) {
            return res.status(400).json({ message: "Captain cannot be removed" });
        }
        team.members = team.members.filter((m) => String(m) !== String(userId));
        await team.save();
        const player = await User.findById(userId);
        if (player) {
            player.team = undefined;
            await player.save();
        }
        const updated = await Team.findById(teamId)
            .populate("members", "username email role")
            .populate("captain", "username email role");
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const leaveTeam = async (req, res) => {
    const userId = req.user.userId;
    try {
        const user = await User.findById(userId);
        if (!user.team) return res.status(400).json({ message: "Not in a team" });
        const team = await Team.findById(user.team);
        if (!team) {
            user.team = undefined;
            await user.save();
            return res.json({ message: "Left the team" });
        }
        if (String(team.captain) === String(userId)) {
            return res.status(400).json({ message: "Captain cannot leave. Transfer captaincy first." });
        }
        team.members = team.members.filter((m) => String(m) !== String(userId));
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
