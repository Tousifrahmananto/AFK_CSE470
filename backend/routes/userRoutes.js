const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect: auth } = require("../middlewares/authMiddleware");

const {
    getUserPublic,
    getUserProfile,
    getMe,
    getMyTournaments,
} = require("../controllers/userController");

// current user
router.get("/me/profile", auth, getMe);
router.get("/me/tournaments", auth, getMyTournaments);

// minimal public info (still behind auth)
router.get("/:id/public", auth, getUserPublic);

// full profile
router.get("/:id", auth, getUserProfile);

module.exports = router;
