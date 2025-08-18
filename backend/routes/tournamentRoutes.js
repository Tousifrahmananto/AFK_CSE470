const express = require("express");
const router = express.Router();
const {
  getAllTournaments,
  createTournament,
  updateTournament,
  deleteTournament,
  getParticipants,
  toggleRegistration,
  getMyStatus,
  registerSolo,
  registerTeam,
  unregisterSolo,
  unregisterTeam,
  adminRemoveSolo,
  adminRemoveTeam,
  generateBracket,
  getBracket,
  setMatchResult,
  getBracketVisibility,
} = require("../controllers/tournamentController");
const { protect } = require("../middlewares/authMiddleware");
const { isAdmin } = require("../middlewares/adminMiddleware");

// Public list
router.get("/", getAllTournaments);

// Bracket (protected for users; Admin bypass inside controller)
router.get("/:id/bracket", protect, getBracket);
router.get("/:id/bracket/visibility", protect, getBracketVisibility);

// Admin only
router.post("/create", protect, isAdmin, createTournament);
router.put("/:id", protect, isAdmin, updateTournament);
router.delete("/:id", protect, isAdmin, deleteTournament);
router.get("/:id/participants", protect, isAdmin, getParticipants);
router.post("/:id/toggle-registration", protect, isAdmin, toggleRegistration);
router.delete("/:id/remove-solo/:userId", protect, isAdmin, adminRemoveSolo);
router.delete("/:id/remove-team/:teamId", protect, isAdmin, adminRemoveTeam);
router.post("/:id/generate-bracket", protect, isAdmin, generateBracket);
router.post("/:id/bracket/match-result", protect, isAdmin, setMatchResult);

// Protected (logged in) registration
router.get("/:id/my-status", protect, getMyStatus);
router.post("/:id/register-solo", protect, registerSolo);
router.post("/:id/register-team", protect, registerTeam);
router.delete("/:id/unregister-solo", protect, unregisterSolo);
router.delete("/:id/unregister-team", protect, unregisterTeam);

module.exports = router;
