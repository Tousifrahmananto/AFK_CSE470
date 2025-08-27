// src/pages/AdminMatchStatsPage.js
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
    getBracket,
    getMatchPlayerStats,
    setMatchPlayerStats,
    getTeamRoster,
    getUserProfile,
} from "../services/tournamentService";

export default function AdminMatchStatsPage() {
    const { token, user } = useContext(AuthContext);
    const { tournamentId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [title, setTitle] = useState("");
    const [rounds, setRounds] = useState([]);
    const [roundIndex, setRoundIndex] = useState(0);
    const [matchIndex, setMatchIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    const [meta, setMeta] = useState({ map: "", notes: "", p1Score: 0, p2Score: 0 });
    const [rows, setRows] = useState([]);

    // prevent repeated auto-fill loops
    const autoFilledRef = useRef(false);

    // query params (?r=&m=)
    useEffect(() => {
        const sp = new URLSearchParams(location.search);
        const r = Number(sp.get("r"));
        const m = Number(sp.get("m"));
        if (!Number.isNaN(r) && r >= 0) setRoundIndex(r);
        if (!Number.isNaN(m) && m >= 0) setMatchIndex(m);
    }, [location.search]);

    // load bracket shell
    useEffect(() => {
        (async () => {
            try {
                const br = await getBracket(tournamentId, token); // { title, bracketData }
                setTitle(br?.title || "");
                setRounds(br?.bracketData?.rounds || []);
            } catch {
                // ignore
            } finally {
                setLoading(false);
            }
        })();
    }, [tournamentId, token]);

    const currentMatch = useMemo(
        () => (rounds[roundIndex] || [])[matchIndex] || null,
        [rounds, roundIndex, matchIndex]
    );
    const p1 = currentMatch?.p1 || null;
    const p2 = currentMatch?.p2 || null;

    const p1Label = p1?.label || p1?.id || "P1";
    const p2Label = p2?.label || p2?.id || "P2";

    // load existing saved stats (+ meta)
    useEffect(() => {
        (async () => {
            if (!token || !currentMatch) return;
            try {
                const data = await getMatchPlayerStats(tournamentId, roundIndex, matchIndex, token);
                const items = data?.items || [];
                const m = data?.meta || {};
                setMeta({
                    map: m.map || "",
                    notes: m.notes || "",
                    p1Score: Number.isFinite(+m.p1Score) ? +m.p1Score : 0,
                    p2Score: Number.isFinite(+m.p2Score) ? +m.p2Score : 0,
                });
                setRows(
                    items.length
                        ? items.map((x) => ({
                            userId: x.userId || "",
                            kills: x.kills ?? 0,
                            deaths: x.deaths ?? 0,
                            assists: x.assists ?? 0,
                            headshots: x.headshots ?? 0,
                            firstBloods: x.firstBloods ?? 0,
                            clutches: x.clutches ?? 0,
                            plants: x.plants ?? 0,
                            defuses: x.defuses ?? 0,
                            damage: x.damage ?? 0,
                            score: x.score ?? 0,
                        }))
                        : []
                );
                // allow auto-fill to run if there were no items
                autoFilledRef.current = items.length > 0;
            } catch {
                setRows([]);
                autoFilledRef.current = false;
            }
        })();
    }, [token, tournamentId, roundIndex, matchIndex, currentMatch]);

    // helper: add a user id row if not already present
    const addUserIfMissing = (uid) =>
        setRows((r) => {
            const exists = r.some((x) => String(x.userId) === String(uid));
            return exists
                ? r
                : [
                    ...r,
                    {
                        userId: String(uid),
                        kills: 0,
                        deaths: 0,
                        assists: 0,
                        headshots: 0,
                        firstBloods: 0,
                        clutches: 0,
                        plants: 0,
                        defuses: 0,
                        damage: 0,
                        score: 0,
                    },
                ];
        });

    // fetch players for one participant (team or solo)
    const fetchParticipantUsers = async (participant) => {
        if (!participant) return [];
        if (participant.kind === "team") {
            try {
                const t = await getTeamRoster(participant.id, token);
                const ids = [];
                if (t?.captain) ids.push(t.captain._id || t.captain);
                (t?.members || []).forEach((m) => ids.push(m._id || m));
                return ids.filter(Boolean);
            } catch {
                return [];
            }
        } else {
            // solo
            return [participant.id];
        }
    };

    // AUTO-FILL from current match once per selection if there are no rows yet
    useEffect(() => {
        (async () => {
            if (!currentMatch) return;
            if (autoFilledRef.current) return;      // don't repeat
            if (rows.length > 0) return;            // respect existing rows

            const p1Users = await fetchParticipantUsers(p1);
            const p2Users = await fetchParticipantUsers(p2);
            const all = [...new Set([...p1Users, ...p2Users])];

            if (all.length > 0) {
                all.forEach(addUserIfMissing);
                autoFilledRef.current = true;
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentMatch, roundIndex, matchIndex]);

    // manual button to re-fetch/add players (if rosters change)
    const loadPlayersFromMatch = async () => {
        const p1Users = await fetchParticipantUsers(p1);
        const p2Users = await fetchParticipantUsers(p2);
        const all = [...new Set([...p1Users, ...p2Users])];
        if (all.length === 0) {
            alert("No players found for this match.");
            return;
        }
        all.forEach(addUserIfMissing);
    };

    const addRow = () =>
        setRows((r) => [
            ...r,
            {
                userId: "",
                kills: 0,
                deaths: 0,
                assists: 0,
                headshots: 0,
                firstBloods: 0,
                clutches: 0,
                plants: 0,
                defuses: 0,
                damage: 0,
                score: 0,
            },
        ]);

    const setField = (i, k, v) => setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [k]: v } : row)));
    const removeRow = (i) => setRows((r) => r.filter((_, idx) => idx !== i));

    const save = async () => {
        if (!user || user.role !== "Admin") {
            alert("Only admins can save match stats.");
            return;
        }
        try {
            const payloadStats = rows
                .map((r) => ({
                    userId: String(r.userId || "").trim(),
                    kills: +r.kills || 0,
                    deaths: +r.deaths || 0,
                    assists: +r.assists || 0,
                    headshots: +r.headshots || 0,
                    firstBloods: +r.firstBloods || 0,
                    clutches: +r.clutches || 0,
                    plants: +r.plants || 0,
                    defuses: +r.defuses || 0,
                    damage: +r.damage || 0,
                    score: +r.score || 0,
                }))
                .filter((s) => s.userId);

            const matchMeta = {
                map: String(meta.map || "").trim(),
                notes: String(meta.notes || "").trim(),
                p1Score: Number.isFinite(+meta.p1Score) ? +meta.p1Score : 0,
                p2Score: Number.isFinite(+meta.p2Score) ? +meta.p2Score : 0,
            };

            await setMatchPlayerStats(tournamentId, roundIndex, matchIndex, payloadStats, token, matchMeta);
            alert("Stats saved.");
        } catch (e) {
            alert(e?.response?.data?.message || "Failed to save");
        }
    };

    if (loading) return <div style={wrap}>Loading…</div>;
    if (user && user.role !== "Admin") return <div style={wrap}>Forbidden: Admins only.</div>;

    return (
        <div style={wrap}>
            <div style={panel}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <button onClick={() => navigate(-1)} style={btnAlt}>← Back</button>
                    <h2 style={{ margin: 0 }}>{title || "Tournament"}</h2>
                </div>

                {/* Selector */}
                <div style={card}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <div>
                            <label style={label}>Round</label>
                            <select
                                value={roundIndex}
                                onChange={(e) => { setRoundIndex(+e.target.value); setMatchIndex(0); autoFilledRef.current = false; setRows([]); }}
                                style={input}
                            >
                                {rounds.map((_, i) => (
                                    <option key={i} value={i}>Round {i + 1}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={label}>Match</label>
                            <select
                                value={matchIndex}
                                onChange={(e) => { setMatchIndex(+e.target.value); autoFilledRef.current = false; setRows([]); }}
                                style={input}
                            >
                                {(rounds[roundIndex] || []).map((_, i) => (
                                    <option key={i} value={i}>Match {i + 1}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ marginTop: 10, color: "#9aa3b2" }}>
                        Selected: <b>{p1Label}</b> vs <b>{p2Label}</b>
                    </div>
                </div>

                {/* Meta */}
                <div style={card}>
                    <h3 style={{ marginTop: 0 }}>Match Meta</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <div>
                            <label style={label}>Map</label>
                            <input style={input} placeholder="Ascent, Mirage, etc." value={meta.map} onChange={(e) => setMeta((m) => ({ ...m, map: e.target.value }))} />
                        </div>
                        <div />
                        <div>
                            <label style={label}>{p1Label} Score</label>
                            <input type="number" style={input} value={meta.p1Score} onChange={(e) => setMeta((m) => ({ ...m, p1Score: e.target.value }))} />
                        </div>
                        <div>
                            <label style={label}>{p2Label} Score</label>
                            <input type="number" style={input} value={meta.p2Score} onChange={(e) => setMeta((m) => ({ ...m, p2Score: e.target.value }))} />
                        </div>
                    </div>
                    <div style={{ marginTop: 8 }}>
                        <label style={label}>Notes</label>
                        <textarea rows={3} style={{ ...input, resize: "vertical" }} placeholder="Optional notes (OT, tech issues, etc.)" value={meta.notes} onChange={(e) => setMeta((m) => ({ ...m, notes: e.target.value }))} />
                    </div>
                </div>

                {/* Players */}
                <div style={card}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, gap: 8 }}>
                        <h3 style={{ margin: 0 }}>Player stats</h3>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={loadPlayersFromMatch} style={btn}>Load players from match</button>
                            <button onClick={addRow} style={btn}>+ Add player</button>
                            <button onClick={save} style={btnPrimary}>Save stats</button>
                        </div>
                    </div>

                    <div className="grid" style={{ display: "grid", gridTemplateColumns: "2.2fr repeat(10, 1fr) 80px", gap: 8 }}>
                        <div style={headCell}>User ID</div>
                        <div style={headCell}>K</div>
                        <div style={headCell}>D</div>
                        <div style={headCell}>A</div>
                        <div style={headCell}>HS</div>
                        <div style={headCell}>FB</div>
                        <div style={headCell}>Clutch</div>
                        <div style={headCell}>Plant</div>
                        <div style={headCell}>Defuse</div>
                        <div style={headCell}>DMG</div>
                        <div style={headCell}>Score</div>
                        <div />

                        {rows.map((r, i) => {
                            const kd = (+r.kills || 0) / Math.max(1, +r.deaths || 0);
                            return (
                                <React.Fragment key={`${r.userId}-${i}`}>
                                    <input placeholder="Mongo User ID" value={r.userId} onChange={(e) => setField(i, "userId", e.target.value)} style={input} />
                                    <input type="number" value={r.kills} onChange={(e) => setField(i, "kills", e.target.value)} style={input} />
                                    <input type="number" value={r.deaths} onChange={(e) => setField(i, "deaths", e.target.value)} style={input} />
                                    <input type="number" value={r.assists} onChange={(e) => setField(i, "assists", e.target.value)} style={input} />
                                    <input type="number" value={r.headshots} onChange={(e) => setField(i, "headshots", e.target.value)} style={input} />
                                    <input type="number" value={r.firstBloods} onChange={(e) => setField(i, "firstBloods", e.target.value)} style={input} />
                                    <input type="number" value={r.clutches} onChange={(e) => setField(i, "clutches", e.target.value)} style={input} />
                                    <input type="number" value={r.plants} onChange={(e) => setField(i, "plants", e.target.value)} style={input} />
                                    <input type="number" value={r.defuses} onChange={(e) => setField(i, "defuses", e.target.value)} style={input} />
                                    <input type="number" value={r.damage} onChange={(e) => setField(i, "damage", e.target.value)} style={input} />
                                    <input type="number" value={r.score} onChange={(e) => setField(i, "score", e.target.value)} style={input} />
                                    <button onClick={() => removeRow(i)} style={btnAlt}>Remove</button>
                                    <div style={{ gridColumn: "1 / -1", fontSize: 12, color: "#9aa3b2", marginTop: -2 }}>
                                        KD: {Math.round(kd * 100) / 100}
                                    </div>
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            </div>

            <style>{`
        @media (max-width: 1100px){
          .grid{ grid-template-columns: 2fr repeat(8, 1fr) 80px; }
        }
        @media (max-width: 860px){
          .grid{ grid-template-columns: 1.8fr repeat(6, 1fr) 70px; }
        }
        @media (max-width: 640px){
          .grid{ grid-template-columns: 1.5fr repeat(3, 1fr) 70px; }
          .grid > *:nth-child(n+7){ display:none }
        }
      `}</style>
        </div>
    );
}

/* styles */
const wrap = { minHeight: "100vh", background: "#0f1115", color: "#e8ecf2", padding: 16, display: "flex", justifyContent: "center" };
const panel = { width: "100%", maxWidth: 1000, display: "grid", gap: 12 };
const card = { background: "#151922", border: "1px solid #232838", borderRadius: 12, padding: 12 };
const input = { width: "100%", padding: "10px 12px", borderRadius: 10, background: "#0f1320", border: "1px solid #232838", color: "#e8ecf2" };
const label = { fontSize: 12, color: "#a8b0bf", marginBottom: 4, display: "block" };
const btn = { padding: "9px 12px", borderRadius: 10, background: "#232a41", color: "#e8ecf2", border: "1px solid #2e3753", cursor: "pointer" };
const btnAlt = { ...btn, background: "#101523", border: "1px solid #2a3350" };
const btnPrimary = { ...btn, background: "#1f6feb", border: 0 };
const headCell = { fontSize: 12, color: "#9aa3b2", padding: "0 6px" };
