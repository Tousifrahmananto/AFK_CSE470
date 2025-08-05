const express = require("express");
const router = express.Router();
const { getUserProfile } = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");

router.get("/:id", protect, getUserProfile);

module.exports = router;
