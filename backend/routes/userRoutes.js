const express = require("express");
const router = express.Router();
const { getUserProfile, getMyTournaments } = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");

// Current user’s joined tournaments (solo or via team)
router.get("/me/tournaments", protect, getMyTournaments);

// View any user profile by id (protected)
router.get("/:id", protect, getUserProfile);

module.exports = router;
