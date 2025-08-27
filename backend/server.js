
// backend/server.js
require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const path = require("path");

// Routers
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const tournamentRoutes = require("./routes/tournamentRoutes");
const teamRoutes = require("./routes/teamRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const mediaRoutes = require("./routes/mediaRoutes");
const adRoutes = require("./routes/adRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
// Auth middleware
const { protect } = require("./middlewares/authMiddleware");

const app = express();
const PORT = process.env.PORT || 5000;
const ORIGIN = process.env.CLIENT_ORIGIN || true;

/* ------------------------------- Middleware ------------------------------- */
app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(express.json({ limit: "10mb" }));

/* ------------------------------ HTTP + Socket ----------------------------- */
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ORIGIN, credentials: true },
});

// expose io so controllers can do: const io = req.app.get('io')
app.set("io", io);

// Minimal socket wiring: client should emit { userId } after connecting
io.on("connection", (socket) => {
  socket.on("identify", ({ userId } = {}) => {
    const id = String(userId || "");
    if (!id) return;
    socket.join(`user:${id}`);
    socket.data.userId = id;
  });

  socket.on("ping", () => socket.emit("pong"));
});

/* --------------------------------- Routes -------------------------------- */
app.get("/api/health", (_req, res) =>
  res.json({ ok: true, ts: new Date().toISOString() })
);

// static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// media & ads
app.use("/api/media", mediaRoutes);
app.use("/api/ads", adRoutes);

// auth / users / tournaments / teams / notifications
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tournaments", tournamentRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/notifications", protect, notificationRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
/* ------------------------------- DB & Start ------------------------------- */
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/afk_productions";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    server.listen(PORT, () => {
      console.log(`Server + Socket.IO running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });
