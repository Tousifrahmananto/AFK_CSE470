// src/pages/MyTeamPage.js
import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

export default function MyTeamPage() {
    const { user, token } = useContext(AuthContext);
    const [team, setTeam] = useState(null);
    const [allPlayers, setAllPlayers] = useState([]);
    const [selectedPlayer, setSelectedPlayer] = useState("");

    // Base API URL
    const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

    // Load “my team” and “all players” on mount
    useEffect(() => {
        if (!token) return;

        axios
            .get(`${API}/teams/my`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => setTeam(res.data))
            .catch(() => setTeam(null));

        axios
            .get(`${API}/teams/players`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => setAllPlayers(res.data))
            .catch(console.error);
    }, [API, token]);

    if (user?.role !== "TeamManager") {
        return <div className="text-center mt-10">Access denied.</div>;
    }
    if (team === null) {
        return <div className="text-center mt-10">Loading…</div>;
    }

    // Determine which players are not yet on this team
    const available = allPlayers.filter(
        (p) => !team.members.some((m) => m._id === p._id)
    );

    const isCaptain = team.captain === user._id;

    // Add selected player
    const addPlayer = async () => {
        if (!selectedPlayer) {
            alert("Select a player first");
            return;
        }
        try {
            const res = await axios.post(
                `${API}/teams/${team._id}/add`,
                { userId: selectedPlayer },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setTeam(res.data);
            setSelectedPlayer("");
        } catch (err) {
            console.error("Add member error:", err);
            alert(err.response?.data?.message || "Failed to add player");
        }
    };

    // Remove a member
    const removeMember = async (memberId) => {
        try {
            const res = await axios.delete(
                `${API}/teams/${team._id}/remove/${memberId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setTeam(res.data);
        } catch (err) {
            console.error("Remove member error:", err);
            alert(err.response?.data?.message || "Failed to remove player");
        }
    };

    // Leave team
    const leaveTeam = async () => {
        try {
            await axios.post(
                `${API}/teams/${team._id}/leave`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setTeam(null);
        } catch (err) {
            console.error("Leave team error:", err);
            alert(err.response?.data?.message || "Failed to leave team");
        }
    };

    return (
        <div className="container mt-10">
            <div className="card p-6" style={{ maxWidth: 600, margin: "auto" }}>
                <h2 className="text-2xl font-bold mb-4">{team.teamName}</h2>

                <h3 className="font-semibold mb-2">Members</h3>
                <ul className="mb-4">
                    {team.members.map((m) => (
                        <li key={m._id} className="flex justify-between mb-1">
                            {m.username}
                            {isCaptain && m._id !== team.captain && (
                                <button
                                    onClick={() => removeMember(m._id)}
                                    className="btn btn-sm"
                                >
                                    Remove
                                </button>
                            )}
                        </li>
                    ))}
                </ul>

                {isCaptain && (
                    <>
                        <h3 className="font-semibold mb-2">Add Player</h3>
                        {available.length === 0 ? (
                            <p>No more players available.</p>
                        ) : (
                            <div className="flex space-x-2 mb-4">
                                <select
                                    value={selectedPlayer}
                                    onChange={(e) => setSelectedPlayer(e.target.value)}
                                    className="input flex-1"
                                >
                                    <option value="">-- Select Player --</option>
                                    {available.map((p) => (
                                        <option key={p._id} value={p._id}>
                                            {p.username}
                                        </option>
                                    ))}
                                </select>
                                <button onClick={addPlayer} className="btn">
                                    Add
                                </button>
                            </div>
                        )}
                    </>
                )}

                {!isCaptain && (
                    <button onClick={leaveTeam} className="btn w-full">
                        Leave Team
                    </button>
                )}
            </div>
        </div>
    );
}
