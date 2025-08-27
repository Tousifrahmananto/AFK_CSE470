const mongoose = require("mongoose");
const User = require("../models/User");
const Team = require("../models/Team");
const Tournament = require("../models/Tournament");

/** Lightweight user info used by roster/stat tools */
async function getUserPublic(req, res) {
  try {
    const u = await User.findById(req.params.id)
      .select("_id username email role")
      .lean();
    if (!u) return res.status(404).json({ message: "User not found" });
    res.json(u);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user" });
  }
}

// ---------- helpers ----------
async function addEffectiveTeam(userLean) {
  // if already populated, keep it
  if (userLean.team && typeof userLean.team === "object") return userLean;

  // fall back to membership search
  const membership = await Team.findOne({ members: userLean._id })
    .select("teamName name logoUrl")
    .lean();

  if (membership) return { ...userLean, team: membership };
  return userLean;
}

async function fetchJoinedTournaments(userId, teamId) {
  const soloList = await Tournament.find({ soloPlayers: userId })
    .select("title game bracket status startDate")
    .lean();

  let teamList = [];
  if (teamId) {
    teamList = await Tournament.find({ teams: teamId })
      .select("title game bracket status startDate")
      .lean();
  }

  return [
    ...soloList.map(t => ({ ...t, mode: "Solo" })),
    ...teamList.map(t => ({ ...t, mode: "Team" })),
  ].sort((a, b) => new Date(a.startDate || 0) - new Date(b.startDate || 0));
}

// ---------- main profile handlers ----------
async function getUserProfile(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const raw = await User.findById(id)
      .select("-password -passwordHash -__v")
      .populate({ path: "team", select: "teamName name logoUrl" })
      .lean();

    if (!raw) return res.status(404).json({ message: "User not found" });

    const user = await addEffectiveTeam(raw);
    const teamId = user.team?._id;
    const joinedTournaments = await fetchJoinedTournaments(user._id, teamId);

    return res.json({ ...user, joinedTournaments });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

async function getMe(req, res) {
  try {
    const meRaw = await User.findById(req.user.userId)
      .select("-password -passwordHash -__v")
      .populate({ path: "team", select: "teamName name logoUrl" })
      .lean();

    if (!meRaw) return res.status(404).json({ message: "User not found" });

    const me = await addEffectiveTeam(meRaw);
    const teamId = me.team?._id;
    const tournaments = await fetchJoinedTournaments(me._id, teamId);

    res.json({ user: me, tournaments });
  } catch (err) {
    res.status(500).json({ message: "Failed to load profile" });
  }
}

async function getMyTournaments(req, res) {
  try {
    const me = await User.findById(req.user.userId).select("team").lean();
    if (!me) return res.status(404).json({ message: "User not found" });

    let teamId = me.team;
    if (!teamId) {
      const membership = await Team.findOne({ members: me._id }).select("_id").lean();
      teamId = membership?._id || null;
    }

    const items = await fetchJoinedTournaments(req.user.userId, teamId);
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch your tournaments" });
  }
}

module.exports = {
  getUserPublic,
  getUserProfile,
  getMe,
  getMyTournaments,
};
