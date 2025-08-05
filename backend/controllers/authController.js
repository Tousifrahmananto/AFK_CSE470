const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Register
const registerUser = async (req, res) => {
    const { username, email, password, role } = req.body;
    try {
        if (await User.findOne({ email })) {
            return res.status(400).json({ message: "User already exists" });
        }
        const hashed = await bcrypt.hash(password, 10);
        const userRole = ["Admin", "Player", "TeamManager"].includes(role)
            ? role
            : "Player";
        await User.create({ username, email, password: hashed, role: userRole });
        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Login
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });
        if (!(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );
        res.json({ token, user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { registerUser, loginUser };
