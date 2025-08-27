// backend/routes/mediaRoutes.js
const router = require("express").Router();
const { protect } = require("../middlewares/authMiddleware");
// ⬇️ import the default uploader (multer instance) instead of { videoUpload }
const uploader = require("../utils/uploader");
const MC = require("../controllers/mediaController");

// simple role gate
const requireRole = (...roles) => (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: "Forbidden" });
    next();
};

// Admin video CRUD
router.post("/videos", protect, requireRole("Admin"), uploader.single("file"), MC.createVideo);
router.put("/videos/:id", protect, requireRole("Admin"), uploader.single("file"), MC.updateVideo);
router.delete("/videos/:id", protect, requireRole("Admin"), MC.deleteVideo);

// Public list
router.get("/videos", MC.listVideos);

module.exports = router;
