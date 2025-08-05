const User = require("../models/User");

// GET /api/users/:id
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select("-passwordHash -__v")           // omit sensitive fields
            .populate({
                path: "tournaments",
                select: "title game bracket status startDate",
            });

        if (!user) return res.status(404).json({ message: "User not found" });

        res.json(user);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

module.exports = { getUserProfile };
