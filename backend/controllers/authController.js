// backend/controllers/authController.js
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/** Normalize like: " sponsor " -> "Sponsor" (anything else -> "") */
function normalizeRole(raw) {
    if (!raw) return "";
    const s = String(raw).trim().toLowerCase();
    if (s === "player") return "Player";
    if (s === "sponsor") return "Sponsor";
    if (s === "partner") return "Partner";
    return "";
}

const PUBLIC_ROLES = new Set(["Player", "Sponsor", "Partner"]);

// Register
const registerUser = async (req, res) => {
    try {
        const username = String(req.body.username || "").trim();
        const email = String(req.body.email || "").trim();
        const password = String(req.body.password || "");
        const roleRaw = req.body.role;

        if (!username || !email || !password) {
            return res.status(400).json({ message: "username, email, and password are required" });
        }

        // prevent duplicate by email or username
        const exists = await User.findOne({ $or: [{ email }, { username }] });
        if (exists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashed = await bcrypt.hash(password, 10);

        // Only allow these roles from public signup (case-insensitive)
        const normalized = normalizeRole(roleRaw);
        const userRole = PUBLIC_ROLES.has(normalized) ? normalized : "Player";

        const user = await User.create({ username, email, password: hashed, role: userRole });

        return res
            .status(201)
            .json({ message: "User registered successfully", user: { id: user._id, role: user.role } });
    } catch (err) {
        console.error("register error:", err);
        return res.status(500).json({ message: "Registration failed" });
    }
};

// Login
const loginUser = async (req, res) => {
    try {
        const email = String(req.body.email || "").trim();
        const password = String(req.body.password || "");

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });
        if (user && user.isBanned) {
            return res.status(403).json({ message: "This account has been banned by an administrator." });
        }
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(401).json({ message: "Invalid credentials" });

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );
        return res.json({ token, user });
    } catch (err) {
        console.error("login error:", err);
        return res.status(500).json({ message: "Login failed" });
    }
};

module.exports = { registerUser, loginUser };
