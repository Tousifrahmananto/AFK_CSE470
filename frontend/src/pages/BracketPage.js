import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getBracket, setMatchResult } from "../services/tournamentService";

const MATCH_H = 78; // px
const GAP = 24;     // px

const MatchBox = ({ children, withConnector, variant, vlen }) => (
    <div
        className={`match-box ${withConnector ? "with-connector" : ""} ${variant || ""}`}
        style={withConnector ? { ["--v"]: `${vlen || 0}px` } : {}}
    >
        {children}
    </div>
);

const LineItem = ({ p, highlight }) => {
    const text = p?.label
        ? p.label
        : p
            ? `${p.kind === "team" ? "Team" : "Solo"} ${String(p.id).slice(0, 6)}…`
            : "BYE";
    return (
        <div className={`row ${highlight ? "win" : ""}`}>
            <span className={p ? "" : "muted"}>{text}</span>
            {highlight && <span className="tick">✓</span>}
        </div>
    );
};

export default function BracketPage() {
    const { id } = useParams();
    const { user, token } = useContext(AuthContext);
    const isAdmin = user?.role === "Admin";

    const [title, setTitle] = useState("");
    const [bracket, setBracket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lockedMsg, setLockedMsg] = useState("");

    const load = async () => {
        try {
            setLoading(true);
            setLockedMsg("");
            const { title, bracketData } = await getBracket(id, token);
            setTitle(title);
            setBracket(bracketData);
        } catch (e) {
            const status = e?.response?.status;
            const msg = e?.response?.data?.message || "";
            if (status === 401) setLockedMsg("Please log in to view the bracket.");
            else if (status === 403) setLockedMsg(msg || "Bracket not available yet.");
            else setLockedMsg("Unable to load bracket.");
            setBracket(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); /* eslint-disable-next-line */ }, [id, token]);

    const handleSetWinner = async (roundIndex, matchIndex, winnerSide) => {
        try {
            await setMatchResult(id, { roundIndex, matchIndex, winnerSide }, token);
            await load();
        } catch (e) {
            alert(e?.response?.data?.message || "Failed to set winner");
        }
    };

    if (loading) return <div className="container mt-8">Loading bracket…</div>;
    if (lockedMsg) return <div className="container mt-8">{lockedMsg}</div>;
    if (!bracket) return <div className="container mt-8">No bracket generated yet.</div>;

    return (
        <div className="container mt-10">
            <h1 className="text-4xl font-extrabold text-center mb-10">{title} — Bracket</h1>

            <div className="bracket">
                {bracket.rounds.map((round, rIdx) => {
                    const group = Math.pow(2, rIdx);
                    const groupHeight = MATCH_H * group + GAP * (group - 1);
                    const offsetTop = rIdx === 0 ? 0 : Math.round(groupHeight / 2 - MATCH_H / 2);
                    const vHalf = Math.round((groupHeight - MATCH_H) / 2);

                    return (
                        <div className="round-col" key={rIdx}>
                            <h3 className="round-title">Round {rIdx + 1}</h3>

                            {round.map((m, mIdx) => {
                                const mt = rIdx === 0 ? (mIdx === 0 ? 0 : GAP) : (mIdx === 0 ? offsetTop : (groupHeight - MATCH_H));
                                const variant = (rIdx < bracket.rounds.length - 1) ? (mIdx % 2 === 0 ? "top" : "bottom") : "";
                                const showButtons = isAdmin && !m.winner && (m.p1 || m.p2);

                                return (
                                    <div key={mIdx} style={{ marginTop: mt }}>
                                        <MatchBox
                                            withConnector={rIdx < bracket.rounds.length - 1}
                                            variant={variant}
                                            vlen={vHalf}
                                        >
                                            <div className="meta">Match {mIdx + 1}</div>

                                            <LineItem p={m.p1} highlight={m.winner && m.winner === m.p1} />
                                            <LineItem p={m.p2} highlight={m.winner && m.winner === m.p2} />

                                            {showButtons && (
                                                <div className="btn-row">
                                                    <button className="btn" disabled={!m.p1} onClick={() => handleSetWinner(rIdx, mIdx, "p1")}>P1 Wins</button>
                                                    <button className="btn" disabled={!m.p2} onClick={() => handleSetWinner(rIdx, mIdx, "p2")}>P2 Wins</button>
                                                </div>
                                            )}

                                            {m.winner && (
                                                <div className="winner">
                                                    Winner:&nbsp;<strong>{m.winner.label || (m.winner.kind === "team" ? "Team" : "Solo")}</strong>
                                                </div>
                                            )}
                                        </MatchBox>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
