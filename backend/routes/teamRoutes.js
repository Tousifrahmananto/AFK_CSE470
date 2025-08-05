const express = require("express");
const router = express.Router();
const {
    listPlayers,
    createTeam,
    getMyTeam,
    addMember,
    removeMember,
    leaveTeam,
} = require("../controllers/teamController");
const { protect } = require("../middlewares/authMiddleware");

router.get("/players", protect, listPlayers);
router.post("/create", protect, createTeam);
router.get("/my", protect, getMyTeam);
router.post("/:teamId/add", protect, addMember);
router.delete("/:teamId/remove/:userId", protect, removeMember);
router.post("/:teamId/leave", protect, leaveTeam);

module.exports = router;
