const express = require("express");
const router = express.Router();
const { getPlayersLeaderboard } = require("../controllers/leaderboardController");
const { protect } = require("../middlewares/authMiddleware");

// Public or protected – your call. I’ll keep it public:
router.get("/players", getPlayersLeaderboard);

module.exports = router;
