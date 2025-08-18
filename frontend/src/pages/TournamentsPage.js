import React, { useContext, useEffect, useState } from "react";
import {
    getAllTournaments,
    getMyStatus,
    registerSolo,
    registerTeam,
    unregisterSolo,
    unregisterTeam,
} from "../services/tournamentService";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function TournamentsPage() {
    const { user, token } = useContext(AuthContext);
    const [list, setList] = useState([]);
    const [statusMap, setStatusMap] = useState({});
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const data = await getAllTournaments({}, token);
            setList(data);
            if (user) {
                const map = {};
                for (const t of data) {
                    try {
                        const s = await getMyStatus(t._id, token);
                        map[t._id] = s;
                    } catch {
                        map[t._id] = { isSoloRegistered: false, isTeamRegistered: false };
                    }
                }
                setStatusMap(map);
            } else {
                setStatusMap({});
            }
        } catch (e) {
            console.error(e);
            alert("Failed to load tournaments");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); /* eslint-disable-next-line */ }, [token]);

    const doSolo = async (t) => {
        try {
            if (statusMap[t._id]?.isSoloRegistered) {
                await unregisterSolo(t._id, token);
            } else {
                await registerSolo(t._id, token);
            }
            await load();
        } catch (err) {
            alert(err?.response?.data?.message || "Action failed");
        }
    };

    const doTeam = async (t) => {
        try {
            if (statusMap[t._id]?.isTeamRegistered) {
                await unregisterTeam(t._id, token);
            } else {
                await registerTeam(t._id, token);
            }
            await load();
        } catch (err) {
            alert(err?.response?.data?.message || "Action failed");
        }
    };

    return (
        <div className="container mt-8">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold">Tournaments</h1>
            </div>

            {loading && <div>Loading…</div>}
            {!loading && list.length === 0 && <div>No tournaments.</div>}

            <div className="grid gap-4">
                {list.map((t) => {
                    const s = statusMap[t._id] || { isSoloRegistered: false, isTeamRegistered: false };
                    const soloLeft = t.playerLimit > 0 ? Math.max(0, t.playerLimit - (t.soloCount || 0)) : null;
                    const teamLeft = t.teamLimit > 0 ? Math.max(0, t.teamLimit - (t.teamCount || 0)) : null;

                    return (
                        <div key={t._id} className="rounded-xl bg-[#12131c] border border-[#23263A] p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-xl font-semibold">{t.title}</div>
                                    <div className="opacity-70 text-sm">{t.game} • {t.bracket}</div>
                                    <div className="opacity-70 text-sm">
                                        Reg. deadline: {t.registrationDeadline ? new Date(t.registrationDeadline).toLocaleDateString() : "-"}
                                        {"  "}• Start: {t.startDate ? new Date(t.startDate).toLocaleDateString() : "-"}
                                        {"  "}• Status: {t.status}
                                    </div>
                                    <div className="opacity-70 text-sm">
                                        Solo: {t.playerLimit ?? 0} cap ({soloLeft ?? "∞"} left) • Teams: {t.teamLimit ?? 0} cap ({teamLeft ?? "∞"} left)
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Link to={`/tournaments/${t._id}/bracket`} className="btn">View Bracket</Link>
                                    {user && (
                                        <>
                                            {t.playerLimit > 0 && (
                                                <button className="btn" onClick={() => doSolo(t)}>
                                                    {s.isSoloRegistered ? "Unregister Solo" : "Register Solo"}
                                                </button>
                                            )}
                                            {t.teamLimit > 0 && (
                                                <button className="btn" onClick={() => doTeam(t)}>
                                                    {s.isTeamRegistered ? "Unregister Team" : "Register Team"}
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
