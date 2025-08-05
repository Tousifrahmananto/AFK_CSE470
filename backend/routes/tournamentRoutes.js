const express = require("express");
const router = express.Router();
const {
    getAllTournaments,
    createTournament,
    updateTournament,
    deleteTournament,
    registerSolo,
    registerTeam
} = require("../controllers/tournamentController");
const { protect } = require("../middlewares/authMiddleware");
const { isAdmin } = require("../middlewares/adminMiddleware");

// Public
router.get("/", getAllTournaments);

// Admin only
router.post("/create", protect, isAdmin, createTournament);
router.put("/:id", protect, isAdmin, updateTournament);
router.delete("/:id", protect, isAdmin, deleteTournament);

// Protected registration routes
router.post("/:id/register-solo", protect, registerSolo);
router.post("/:id/register-team", protect, registerTeam);

module.exports = router;
