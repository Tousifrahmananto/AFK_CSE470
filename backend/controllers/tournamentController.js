const Tournament = require("../models/Tournament");
const User = require("../models/User");
const Team = require("../models/Team");

// ---- constants & helpers ----
const BRACKETS = ["Single Elimination", "Double Elimination", "Round Robin"];
const STATUSES = ["Upcoming", "Live", "Completed"];

const toDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};
const isPast = (d) => d && d.getTime() < Date.now();

// shuffle + bracket helpers
function fisherYatesShuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function nextPowerOfTwo(n) { let p = 1; while (p < n) p <<= 1; return p; }
function buildSingleElimRounds(ordered) {
  const N = ordered.length;
  const size = nextPowerOfTwo(N);
  const withByes = ordered.concat(Array(size - N).fill(null)); // null => BYE
  const rounds = [];
  const round1 = [];
  for (let i = 0; i < withByes.length; i += 2) {
    round1.push({ p1: withByes[i], p2: withByes[i + 1] ?? null, winner: null });
  }
  rounds.push(round1);
  let len = round1.length;
  while (len > 1) {
    len = Math.ceil(len / 2);
    rounds.push(new Array(len).fill(null).map(() => ({ p1: null, p2: null, winner: null })));
  }
  return rounds;
}
function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
function placeWinnerInNextRound(bracketData, roundIndex, matchIndex, winnerObj) {
  const nextRoundIndex = roundIndex + 1;
  if (!bracketData.rounds[nextRoundIndex]) return; // last round
  const nextMatchIndex = Math.floor(matchIndex / 2);
  const slot = matchIndex % 2 === 0 ? "p1" : "p2";
  const m = bracketData.rounds[nextRoundIndex][nextMatchIndex];
  if (!m) return;
  if (m[slot] == null) m[slot] = winnerObj; // don't overwrite if already set
}

// Move single entrants forward ONE round without declaring a winner.
function promoteByesOneRound(bracketData) {
  for (let r = 0; r < bracketData.rounds.length - 1; r++) {
    const round = bracketData.rounds[r];
    for (let i = 0; i < round.length; i++) {
      const match = round[i];
      if (!match) continue;
      const { p1, p2 } = match;
      if ((p1 && !p2) || (p2 && !p1)) {
        const advancer = p1 || p2;
        const nextRoundIndex = r + 1;
        const nextMatchIndex = Math.floor(i / 2);
        const slot = i % 2 === 0 ? "p1" : "p2";
        const nxt = bracketData.rounds[nextRoundIndex][nextMatchIndex];
        if (nxt && nxt[slot] == null) nxt[slot] = advancer;
      }
    }
  }
}

// Visibility rule for non-admins
function isBracketVisibleToUsers(t) {
  const deadlinePassed =
    t.registrationDeadline && new Date(t.registrationDeadline).getTime() < Date.now();
  const regClosed = t.registrationOpen === false || (t.status && t.status !== "Upcoming");
  const teamsFull = t.teamLimit > 0 && (t.teams?.length || 0) >= t.teamLimit;
  const solosFull = t.playerLimit > 0 && (t.soloPlayers?.length || 0) >= t.playerLimit;
  return regClosed || deadlinePassed || teamsFull || solosFull;
}

// accept legacy field names
function normalizeBody(body) {
  const bracket = body.bracket ?? body.format ?? "";
  const playerLimit =
    body.playerLimit !== undefined ? body.playerLimit
      : body.maxPlayers !== undefined ? body.maxPlayers
        : 0;
  return {
    title: body.title,
    game: body.game,
    bracket,
    startDate: body.startDate,
    endDate: body.endDate,
    registrationDeadline: body.registrationDeadline,
    playerLimit,
    teamLimit: body.teamLimit ?? 0,
    status: body.status,
    registrationOpen: body.registrationOpen,
    description: body.description,
    rules: body.rules,
    location: body.location,
    prizePool: body.prizePool,
    entryFee: body.entryFee,
  };
}
function validate(body, isCreate = true) {
  const e = {};
  const {
    title, game, bracket, startDate, endDate,
    registrationDeadline, playerLimit, teamLimit, status,
  } = body;
  if (isCreate) {
    if (!title) e.title = "title is required";
    if (!game) e.game = "game is required";
    if (!bracket) e.bracket = "bracket is required";
    if (!registrationDeadline) e.registrationDeadline = "registrationDeadline is required";
    if (!startDate) e.startDate = "startDate is required";
    if (!endDate) e.endDate = "endDate is required";
  }
  if (bracket && !BRACKETS.includes(bracket)) e.bracket = "invalid bracket";
  const s = toDate(startDate), nd = toDate(endDate), r = toDate(registrationDeadline);
  if (startDate && !s) e.startDate = "startDate is invalid";
  if (endDate && !nd) e.endDate = "endDate is invalid";
  if (registrationDeadline && !r) e.registrationDeadline = "registrationDeadline is invalid";
  if (s && nd && nd < s) e.dates = "endDate must be after startDate";
  if (r && s && r > s) e.deadline = "registrationDeadline must be on/before startDate";
  if (playerLimit !== undefined) { const p = Number(playerLimit); if (Number.isNaN(p) || p < 0) e.playerLimit = "playerLimit must be >= 0"; }
  if (teamLimit !== undefined) { const t = Number(teamLimit); if (Number.isNaN(t) || t < 0) e.teamLimit = "teamLimit must be >= 0"; }
  if (status && !STATUSES.includes(status)) e.status = "invalid status";
  return { valid: Object.keys(e).length === 0, errors: e };
}

/* ---------- label helpers (teamName / username) ---------- */
async function buildLabelMaps(tournamentDoc) {
  const teamIds = tournamentDoc.teams || [];
  const soloIds = tournamentDoc.soloPlayers || [];

  const teams = await Team.find({ _id: { $in: teamIds } })
    .select("_id teamName")   // <- teamName here
    .lean();

  const users = await User.find({ _id: { $in: soloIds } })
    .select("_id username name")
    .lean();

  const teamMap = {};
  for (const tm of teams) teamMap[String(tm._id)] = tm.teamName || String(tm._id);

  const userMap = {};
  for (const u of users) userMap[String(u._id)] = u.username || u.name || String(u._id);

  return { teamMap, userMap };
}

function labelForParticipant(p, teamMap, userMap) {
  if (!p) return null;
  if (p.label) return p.label; // already labeled
  const sid = String(p.id);
  return p.kind === "team" ? (teamMap[sid] || sid) : (userMap[sid] || sid);
}

function enrichBracketLabels(bracketData, teamMap, userMap) {
  if (!bracketData) return bracketData;

  if (Array.isArray(bracketData.participants)) {
    bracketData.participants = bracketData.participants.map((p) =>
      p ? { ...p, label: labelForParticipant(p, teamMap, userMap) } : null
    );
  }
  if (Array.isArray(bracketData.rounds)) {
    for (const round of bracketData.rounds) {
      for (const match of round) {
        if (!match) continue;
        if (match.p1) match.p1 = { ...match.p1, label: labelForParticipant(match.p1, teamMap, userMap) };
        if (match.p2) match.p2 = { ...match.p2, label: labelForParticipant(match.p2, teamMap, userMap) };
        if (match.winner) match.winner = { ...match.winner, label: labelForParticipant(match.winner, teamMap, userMap) };
      }
    }
  }
  return bracketData;
}

/* ---------- LIST ---------- */
exports.getAllTournaments = async (req, res) => {
  try {
    const { status, game, from, to } = req.query;
    const q = {};
    if (status && STATUSES.includes(status)) q.status = status;
    if (game) q.game = new RegExp(`^${game}$`, "i");
    if (from || to) {
      q.startDate = {};
      if (from) q.startDate.$gte = toDate(from);
      if (to) q.startDate.$lte = toDate(to);
    }
    const list = await Tournament.find(q).sort({ startDate: 1 }).lean();
    const enriched = list.map((t) => ({
      ...t,
      soloCount: (t.soloPlayers || []).length,
      teamCount: (t.teams || []).length,
      soloSpotsLeft: t.playerLimit > 0 ? Math.max(0, t.playerLimit - (t.soloPlayers || []).length) : null,
      teamSpotsLeft: t.teamLimit > 0 ? Math.max(0, t.teamLimit - (t.teams || []).length) : null,
    }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch tournaments" });
  }
};

/* ---------- CRUD ---------- */
exports.createTournament = async (req, res) => {
  try {
    const normalized = normalizeBody(req.body);
    const { valid, errors } = validate(normalized, true);
    if (!valid) return res.status(400).json({ message: "Validation failed", errors });
    const payload = {
      title: normalized.title,
      game: normalized.game,
      bracket: normalized.bracket || "Single Elimination",
      startDate: toDate(normalized.startDate),
      endDate: toDate(normalized.endDate),
      registrationDeadline: toDate(normalized.registrationDeadline),
      playerLimit: Number(normalized.playerLimit ?? 0),
      teamLimit: Number(normalized.teamLimit ?? 0),
      status: normalized.status || "Upcoming",
      registrationOpen: normalized.registrationOpen !== undefined ? !!normalized.registrationOpen : true,
      description: normalized.description || "",
      rules: normalized.rules || "",
      location: normalized.location || "",
      prizePool: normalized.prizePool || "",
      entryFee: normalized.entryFee || "",
    };
    if (isPast(payload.registrationDeadline)) {
      return res.status(400).json({ message: "registrationDeadline is in the past" });
    }
    const created = await Tournament.create(payload);
    res.status(201).json(created);
  } catch (err) {
    console.error("Create tournament error:", err);
    res.status(500).json({ message: "Failed to create tournament" });
  }
};

exports.updateTournament = async (req, res) => {
  try {
    const normalized = normalizeBody(req.body);
    const { valid, errors } = validate(normalized, false);
    if (!valid) return res.status(400).json({ message: "Validation failed", errors });
    const updates = {};
    [
      "title", "game", "bracket", "status", "registrationOpen",
      "startDate", "endDate", "registrationDeadline",
      "playerLimit", "teamLimit", "description", "rules", "location", "prizePool", "entryFee",
    ].forEach((k) => {
      if (normalized[k] !== undefined) {
        updates[k] = ["startDate", "endDate", "registrationDeadline"].includes(k)
          ? toDate(normalized[k])
          : normalized[k];
      }
    });
    const t = await Tournament.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!t) return res.status(404).json({ message: "Tournament not found" });
    res.json(t);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteTournament = async (req, res) => {
  try {
    const t = await Tournament.findByIdAndDelete(req.params.id);
    if (!t) return res.status(404).json({ message: "Tournament not found" });
    res.json({ message: "Tournament deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------- PARTICIPANTS & REGISTRATION TOGGLE ---------- */
exports.getParticipants = async (req, res) => {
  try {
    const t = await Tournament.findById(req.params.id)
      .populate("soloPlayers", "username email role")
      .populate({
        path: "teams",
        populate: [
          { path: "captain", select: "username email role" },
          { path: "members", select: "username email role" },
        ],
      });
    if (!t) return res.status(404).json({ message: "Tournament not found" });
    res.json({
      soloPlayers: t.soloPlayers,
      teams: t.teams,
      counts: { solo: t.soloPlayers.length, teams: t.teams.length },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch participants" });
  }
};

exports.toggleRegistration = async (req, res) => {
  try {
    const t = await Tournament.findById(req.params.id);
    if (!t) return res.status(404).json({ message: "Tournament not found" });
    t.registrationOpen = !t.registrationOpen;
    t.lastRegistrationActionBy = req.user?.email || req.user?.userId || "admin";
    await t.save();
    res.json({ registrationOpen: t.registrationOpen });
  } catch (err) {
    res.status(500).json({ message: "Failed to toggle registration" });
  }
};

/* ---------- MY STATUS ---------- */
exports.getMyStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const me = await User.findById(userId).select("team");
    const t = await Tournament.findById(req.params.id).select("soloPlayers teams");
    if (!t) return res.status(404).json({ message: "Tournament not found" });
    const isSoloRegistered = (t.soloPlayers || []).some(id => String(id) === String(userId));
    const isTeamRegistered = me?.team
      ? (t.teams || []).some(id => String(id) === String(me.team))
      : false;
    res.json({ isSoloRegistered, isTeamRegistered });
  } catch (err) {
    res.status(500).json({ message: "Failed to get status" });
  }
};

/* ---------- REGISTER / UNREGISTER ---------- */
exports.registerSolo = async (req, res) => {
  try {
    const userId = req.user.userId;
    const t = await Tournament.findById(req.params.id);
    if (!t) return res.status(404).json({ message: "Tournament not found" });
    if (t.status !== "Upcoming") return res.status(400).json({ message: "Registration is not open" });
    if (!t.registrationOpen) return res.status(400).json({ message: "Registration is closed by admin" });
    if (isPast(t.registrationDeadline)) return res.status(400).json({ message: "Registration deadline has passed" });
    if (t.playerLimit <= 0) return res.status(400).json({ message: "Solo registration is disabled" });
    if ((t.soloPlayers || []).length >= t.playerLimit) return res.status(400).json({ message: "Solo slots are full" });
    if ((t.soloPlayers || []).some((id) => String(id) === String(userId))) return res.status(400).json({ message: "Already registered as solo" });

    const me = await User.findById(userId);
    if (me?.team && (t.teams || []).some((id) => String(id) === String(me.team))) {
      return res.status(400).json({ message: "Your team is already registered" });
    }
    t.soloPlayers.push(userId);
    await t.save();
    res.json({ message: "Registered as solo player", tournamentId: t._id });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.registerTeam = async (req, res) => {
  try {
    const requesterId = req.user.userId;
    const requesterRole = req.user.role;

    const t = await Tournament.findById(req.params.id);
    if (!t) return res.status(404).json({ message: "Tournament not found" });
    if (t.status !== "Upcoming") return res.status(400).json({ message: "Registration is not open" });
    if (!t.registrationOpen) return res.status(400).json({ message: "Registration is closed by admin" });
    if (isPast(t.registrationDeadline)) return res.status(400).json({ message: "Registration deadline has passed" });
    if (t.teamLimit <= 0) return res.status(400).json({ message: "Team registration is disabled" });
    if ((t.teams || []).length >= t.teamLimit) return res.status(400).json({ message: "Team slots are full" });

    const user = await User.findById(requesterId);
    if (!user?.team) return res.status(400).json({ message: "You are not in a team" });

    const team = await Team.findById(user.team);
    if (!team) return res.status(400).json({ message: "Team not found" });

    if (requesterRole === "TeamManager" && String(team.captain) !== String(requesterId)) {
      return res.status(403).json({ message: "Only the team captain can register the team" });
    }
    if ((t.teams || []).some((id) => String(id) === String(team._id))) {
      return res.status(400).json({ message: "Team is already registered" });
    }
    // block if any member registered solo
    const memberIds = team.members.map((m) => String(m));
    const hasSoloMember = (t.soloPlayers || []).some((uid) => memberIds.includes(String(uid)));
    if (hasSoloMember) {
      return res.status(400).json({ message: "A team member is already registered as solo" });
    }

    t.teams.push(team._id);
    await t.save();
    res.json({ message: "Team registered", tournamentId: t._id, teamId: team._id });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.unregisterSolo = async (req, res) => {
  try {
    const userId = req.user.userId;
    const t = await Tournament.findById(req.params.id);
    if (!t) return res.status(404).json({ message: "Tournament not found" });
    t.soloPlayers = (t.soloPlayers || []).filter((id) => String(id) !== String(userId));
    await t.save();
    res.json({ message: "Unregistered from solo", tournamentId: t._id });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.unregisterTeam = async (req, res) => {
  try {
    const requesterId = req.user.userId;
    const requesterRole = req.user.role;
    const user = await User.findById(requesterId);
    if (!user?.team) return res.status(400).json({ message: "You are not in a team" });
    const team = await Team.findById(user.team);
    if (!team) return res.status(400).json({ message: "Team not found" });
    if (requesterRole === "TeamManager" && String(team.captain) !== String(requesterId)) {
      return res.status(403).json({ message: "Only the team captain can unregister the team" });
    }
    const t = await Tournament.findById(req.params.id);
    if (!t) return res.status(404).json({ message: "Tournament not found" });
    t.teams = (t.teams || []).filter((id) => String(id) !== String(team._id));
    await t.save();
    res.json({ message: "Team unregistered", tournamentId: t._id, teamId: team._id });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ---------- ADMIN REMOVE ---------- */
exports.adminRemoveSolo = async (req, res) => {
  try {
    const t = await Tournament.findById(req.params.id);
    if (!t) return res.status(404).json({ message: "Tournament not found" });
    t.soloPlayers = (t.soloPlayers || []).filter((id) => String(id) !== String(req.params.userId));
    await t.save();
    res.json({ message: "Solo player removed", tournamentId: t._id });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.adminRemoveTeam = async (req, res) => {
  try {
    const t = await Tournament.findById(req.params.id);
    if (!t) return res.status(404).json({ message: "Tournament not found" });
    t.teams = (t.teams || []).filter((id) => String(id) !== String(req.params.teamId));
    await t.save();
    res.json({ message: "Team removed", tournamentId: t._id });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ---------- BRACKET ---------- */
exports.generateBracket = async (req, res) => {
  try {
    const t = await Tournament.findById(req.params.id);
    if (!t) return res.status(404).json({ message: "Tournament not found" });

    const { teamMap, userMap } = await buildLabelMaps(t);

    const participants = []
      .concat((t.teams || []).map(id => {
        const sid = String(id);
        return { kind: "team", id: sid, label: teamMap[sid] || sid };
      }))
      .concat((t.soloPlayers || []).map(id => {
        const sid = String(id);
        return { kind: "solo", id: sid, label: userMap[sid] || sid };
      }));

    if (participants.length < 2) {
      return res.status(400).json({ message: "Not enough participants to generate a bracket" });
    }

    // 3× shuffle
    let order = participants.slice();
    order = fisherYatesShuffle(order);
    order = fisherYatesShuffle(order);
    order = fisherYatesShuffle(order);

    const rounds = buildSingleElimRounds(order);

    const bd = {
      generatedAt: new Date().toISOString(),
      method: "3x-shuffle-single-elimination",
      participants: order,
      rounds,
    };

    // no auto winners; just move single entrants up one round
    promoteByesOneRound(bd);

    t.bracketData = bd;
    await t.save();
    res.json({ message: "Bracket generated", bracketData: t.bracketData });
  } catch (err) {
    console.error("generateBracket error:", err);
    res.status(500).json({ message: "Failed to generate bracket" });
  }
};

exports.getBracketVisibility = async (req, res) => {
  try {
    const t = await Tournament.findById(req.params.id)
      .select("registrationOpen registrationDeadline status teamLimit playerLimit teams soloPlayers");
    if (!t) return res.status(404).json({ message: "Tournament not found" });

    const visible = isBracketVisibleToUsers(t);
    res.json({ visible });
  } catch (err) {
    res.status(500).json({ message: "Failed to check visibility" });
  }
};

exports.getBracket = async (req, res) => {
  try {
    const t = await Tournament.findById(req.params.id)
      .select("bracketData title registrationOpen registrationDeadline status teamLimit playerLimit teams soloPlayers");
    if (!t) return res.status(404).json({ message: "Tournament not found" });

    if (req.user?.role !== "Admin") {
      const visible = isBracketVisibleToUsers(t);
      if (!visible) {
        return res.status(403).json({
          message: "Bracket will be visible after registration closes or slots are filled.",
        });
      }
    }

    let bd = t.bracketData;
    if (!bd) return res.json({ title: t.title, bracketData: null });

    // If any participant is missing a label, enrich and persist
    const needsLabel =
      (bd.participants || []).some((p) => p && !p.label) ||
      (bd.rounds || []).some((r) => r.some((m) =>
        (m?.p1 && !m.p1.label) || (m?.p2 && !m.p2.label) || (m?.winner && !m.winner.label)
      ));

    if (needsLabel) {
      const { teamMap, userMap } = await buildLabelMaps(t);
      bd = enrichBracketLabels(bd, teamMap, userMap);
      t.bracketData = bd;
      t.markModified("bracketData");
      await t.save();
    }

    res.json({ title: t.title, bracketData: bd });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch bracket" });
  }
};

exports.setMatchResult = async (req, res) => {
  try {
    const { roundIndex, matchIndex, winnerSide } = req.body;
    if (!["p1", "p2"].includes(winnerSide)) {
      return res.status(400).json({ message: "winnerSide must be 'p1' or 'p2'" });
    }
    const t = await Tournament.findById(req.params.id);
    if (!t) return res.status(404).json({ message: "Tournament not found" });
    if (!t.bracketData) return res.status(400).json({ message: "Bracket not generated yet" });

    const bd = clone(t.bracketData);
    const round = bd.rounds[roundIndex];
    if (!round) return res.status(400).json({ message: "Invalid roundIndex" });
    const match = round[matchIndex];
    if (!match) return res.status(400).json({ message: "Invalid matchIndex" });

    const candidate = match[winnerSide];
    if (!candidate) return res.status(400).json({ message: "Selected side has no participant" });

    match.winner = candidate;
    placeWinnerInNextRound(bd, roundIndex, matchIndex, candidate);

    t.bracketData = bd;
    await t.save();
    res.json({ message: "Result saved", bracketData: t.bracketData });
  } catch (err) {
    console.error("setMatchResult error:", err);
    res.status(500).json({ message: "Failed to save match result" });
  }
};
