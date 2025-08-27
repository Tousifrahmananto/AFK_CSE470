// src/pages/BracketPage.js
import React, { useContext, useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
    getBracket,
    setMatchResult,
} from "../services/tournamentService";

export default function BracketPage() {
    const { token, user } = useContext(AuthContext);
    const { id: tournamentId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState("");
    const [bracketData, setBracketData] = useState(null);

    const isAdmin = user?.role === "Admin";

    useEffect(() => {
        (async () => {
            try {
                const data = await getBracket(tournamentId, token); // { title, bracketData }
                setTitle(data?.title || "");
                setBracketData(data?.bracketData || null);
            } catch (e) {
                console.error(e);
                alert("Failed to load bracket");
            } finally {
                setLoading(false);
            }
        })();
    }, [tournamentId, token]);

    const rounds = useMemo(() => bracketData?.rounds || [], [bracketData]);

    const clickWinner = async (rIdx, mIdx, side) => {
        try {
            await setMatchResult(tournamentId, { roundIndex: rIdx, matchIndex: mIdx, winnerSide: side }, token);
            const data = await getBracket(tournamentId, token);
            setBracketData(data?.bracketData || null);
        } catch (e) {
            alert(e?.response?.data?.message || "Failed to save result");
        }
    };

    if (loading) return <div style={wrap}>Loading…</div>;
    if (!bracketData) return <div style={wrap}>No bracket generated yet.</div>;

    return (
        <div style={wrap}>
            <div style={panel}>
                <h1 style={{ margin: 0 }}>{title || "Tournament"} — Bracket</h1>

                <div style={board}>
                    {rounds.map((round, rIdx) => (
                        <div key={rIdx} style={roundCol}>
                            <div style={roundTitle}>Round {rIdx + 1}</div>

                            {round.map((match, mIdx) => {
                                const p1 = match?.p1?.label || match?.p1?.id || (match?.p1 ? "Player/Team" : "BYE");
                                const p2 = match?.p2?.label || match?.p2?.id || (match?.p2 ? "Player/Team" : "BYE");
                                const hasP1 = !!match?.p1;
                                const hasP2 = !!match?.p2;

                                return (
                                    <div key={mIdx} style={matchCard}>
                                        <div style={matchHeader}>MATCH {mIdx + 1}</div>

                                        <div style={slot}>{p1}</div>
                                        <div style={slot}>{p2}</div>

                                        {match?.winner ? (
                                            <div style={winnerLine}>
                                                Winner: <b>{match.winner?.label || match.winner?.id}</b>
                                            </div>
                                        ) : (
                                            <div style={btnRow}>
                                                <button
                                                    style={btnWin}
                                                    disabled={!hasP1}
                                                    onClick={() => clickWinner(rIdx, mIdx, "p1")}
                                                >
                                                    P1 Wins
                                                </button>
                                                <button
                                                    style={btnWin}
                                                    disabled={!hasP2}
                                                    onClick={() => clickWinner(rIdx, mIdx, "p2")}
                                                >
                                                    P2 Wins
                                                </button>
                                            </div>
                                        )}

                                        {/* Admin-only shortcuts */}
                                        {isAdmin && (
                                            <>
                                                <button
                                                    style={btnEdit}
                                                    onClick={() =>
                                                        navigate(`/admin/match-stats/${tournamentId}?r=${rIdx}&m=${mIdx}`)
                                                    }
                                                >
                                                    Edit Player Stats
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-info"
                                                    onClick={() =>
                                                        navigate(`/admin/match-media/${tournamentId}?r=${rIdx}&m=${mIdx}`)
                                                    }
                                                >
                                                    Upload Media
                                                </button>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* -------------------- styles (local-only, no global bleed) ------------------- */
const wrap = { minHeight: "100vh", background: "#0f1115", color: "#e8ecf2", padding: "24px 16px", display: "flex", justifyContent: "center" };
const panel = { width: "100%", maxWidth: 1200, display: "grid", gap: 16 };
const board = { display: "grid", gridAutoFlow: "column", gridAutoColumns: "minmax(280px, 1fr)", gap: 16, overflowX: "auto", paddingBottom: 4 };
const roundCol = { display: "grid", gap: 16, minWidth: 280 };
const roundTitle = { fontSize: 16, fontWeight: 700, color: "#a8b0bf", textAlign: "center" };
const matchCard = { background: "#151922", border: "1px solid #232838", borderRadius: 12, padding: 12, display: "grid", gap: 8 };
const matchHeader = { fontSize: 12, color: "#8b94a7", textTransform: "uppercase", letterSpacing: 0.5 };
const slot = { padding: "10px 12px", borderRadius: 10, background: "#0f1320", border: "1px solid #232838" };
const winnerLine = { marginTop: 4, fontSize: 14, color: "#a8f0b0" };
const btnRow = { display: "flex", gap: 8, marginTop: 6 };
const btnWin = { padding: "9px 12px", borderRadius: 10, background: "#1a7f30", color: "#fff", border: "0", cursor: "pointer" };
const btnEdit = { marginTop: 6, padding: "8px 10px", borderRadius: 10, background: "#232a41", color: "#e8ecf2", border: "1px solid #2e3753", cursor: "pointer" };
