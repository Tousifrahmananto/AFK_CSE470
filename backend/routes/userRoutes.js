// backend/routes/userRoutes.js
const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/authMiddleware");
const { isAdmin } = require("../middlewares/adminMiddleware");

const {
    getUserPublic,
    getUserProfile,
    getMe,
    getMyTournaments,
    adminListUsers,
    softBanUser,
    unbanUser,
} = require("../controllers/userController");

// Authenticated profile routes
router.get("/me/profile", protect, getMe);
router.get("/me/tournaments", protect, getMyTournaments);
router.get("/:id/profile", protect, getUserProfile);

// Admin moderation (must come before param routes)
router.get("/admin", protect, isAdmin, adminListUsers);

// 🔧 NEW: alias to match frontend call /users/moderation
router.get("/moderation", protect, isAdmin, adminListUsers);

router.post("/:id/soft-ban", protect, isAdmin, softBanUser);
router.post("/:id/unban", protect, isAdmin, unbanUser);

// Public lightweight profile (keep last so it doesn't shadow other routes)
router.get("/:id", getUserPublic);

module.exports = router;
