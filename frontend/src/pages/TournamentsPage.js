import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import {
    getAllTournaments,
    registerSolo,
    registerTeam,
} from "../services/tournamentService";

export default function TournamentsPage() {
    const { user, token } = useContext(AuthContext);
    const [tournaments, setTournaments] = useState([]);

    useEffect(() => {
        getAllTournaments()
            .then(setTournaments)
            .catch((err) => console.error("Fetch tournaments error:", err));
    }, []);

    const handleSolo = async (id) => {
        try {
            await registerSolo(id, token);
            alert("Registered as solo player!");
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };

    const handleTeam = async (id) => {
        try {
            await registerTeam(id, token);
            alert("Team registered!");
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };

    return (
        <div className="container mt-10 px-4">
            <h1 className="text-4xl font-bold text-center mb-8">Tournaments</h1>

            {tournaments.length === 0 ? (
                <p className="text-center">No tournaments available.</p>
            ) : (
                <div className="flex flex-col space-y-6">
                    {tournaments.map((t) => (
                        <div
                            key={t._id}
                            className="card p-6 bg-[#11121a] rounded-xl shadow-lg"
                        >
                            <h2 className="text-2xl font-semibold mb-2">{t.title}</h2>
                            <p><strong>Game:</strong> {t.game}</p>
                            <p><strong>Format:</strong> {t.bracket}</p>
                            <p>
                                <strong>Start:</strong>{" "}
                                {new Date(t.startDate).toLocaleDateString()}
                            </p>
                            <p>
                                <strong>Status:</strong>{" "}
                                {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                            </p>

                            {/* Show buttons only if logged in and tournament is Upcoming */}
                            {user && t.status.toLowerCase() === "upcoming" && (
                                <div className="mt-4 flex flex-wrap gap-4">
                                    <button
                                        onClick={() => handleSolo(t._id)}
                                        className="btn flex-1 max-w-xs"
                                    >
                                        Join Solo
                                    </button>
                                    {user.role === "TeamManager" && (
                                        <button
                                            onClick={() => handleTeam(t._id)}
                                            className="btn flex-1 max-w-xs"
                                        >
                                            Join with My Team
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
