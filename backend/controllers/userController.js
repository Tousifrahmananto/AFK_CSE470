const User = require("../models/User");
const Tournament = require("../models/Tournament");

// GET /api/users/:id
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select("-password -passwordHash -__v") // keep sensitive fields out
            .lean();

        if (!user) return res.status(404).json({ message: "User not found" });

        // Compute tournaments the user has joined (solo or via team)
        const soloList = await Tournament.find({ soloPlayers: user._id })
            .select("title game bracket status startDate")
            .lean();

        let teamList = [];
        if (user.team) {
            // If your User.team stores an ObjectId, you can use it directly; if it's a string id, this still works
            teamList = await Tournament.find({ teams: user.team })
                .select("title game bracket status startDate")
                .lean();
        }

        const joinedTournaments = [
            ...soloList.map((t) => ({ ...t, mode: "Solo" })),
            ...teamList.map((t) => ({ ...t, mode: "Team" })),
        ].sort((a, b) => new Date(a.startDate || 0) - new Date(b.startDate || 0));

        return res.json({ ...user, joinedTournaments });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
exports.getMe = async (req, res) => {
    try {
        const me = await User.findById(req.user.userId)
            .select("-password")
            .populate({ path: "team", select: "teamName logoUrl" }); // ← teamName here

        if (!me) return res.status(404).json({ message: "User not found" });

        // (unchanged) optionally return tournaments the user is in
        const tournaments = await Tournament.find({
            $or: [
                { soloPlayers: me._id },
                ...(me.team ? [{ teams: me.team._id }] : []),
            ],
        }).select("title game bracket startDate status").lean();

        res.json({ user: me, tournaments });
    } catch (err) {
        res.status(500).json({ message: "Failed to load profile" });
    }
};

// GET /api/users/me/tournaments  (protected)
const getMyTournaments = async (req, res) => {
    try {
        const me = await User.findById(req.user.userId).select("team").lean();
        if (!me) return res.status(404).json({ message: "User not found" });

        const soloList = await Tournament.find({ soloPlayers: req.user.userId })
            .select("title game bracket status startDate")
            .lean();

        let teamList = [];
        if (me.team) {
            teamList = await Tournament.find({ teams: me.team })
                .select("title game bracket status startDate")
                .lean();
        }

        const items = [
            ...soloList.map((t) => ({ ...t, mode: "Solo" })),
            ...teamList.map((t) => ({ ...t, mode: "Team" })),
        ].sort((a, b) => new Date(a.startDate || 0) - new Date(b.startDate || 0));

        res.json(items);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch your tournaments" });
    }
};

module.exports = { getUserProfile, getMyTournaments };
