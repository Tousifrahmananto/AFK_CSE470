// src/pages/CreateTeamPage.js
import React, { useContext, useState } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function CreateTeamPage() {
    const { user, token } = useContext(AuthContext);
    const [teamName, setTeamName] = useState("");
    const navigate = useNavigate();

    // Only TeamManagers may access
    if (user?.role !== "TeamManager") {
        return <div className="text-center mt-10">Access denied.</div>;
    }

    const submit = async (e) => {
        e.preventDefault();
        try {
            // POST to your Express route
            await axios.post(
                "http://localhost:5000/api/teams/create",
                { teamName },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert("Team created!");
            navigate("/teams/my");
        } catch (err) {
            // Log full error for debugging
            console.error("CreateTeamPage error:", err);

            // Show user a helpful message
            const msg =
                err.response?.data?.message ||
                err.message ||
                "Unknown error creating team";
            alert(msg);
        }
    };

    return (
        <div className="container mt-10">
            <div
                className="card p-6"
                style={{ maxWidth: 400, margin: "auto", background: "#1f1f2e" }}
            >
                <h2 className="text-2xl font-bold mb-4 text-center">Create Team</h2>
                <form onSubmit={submit} className="space-y-4">
                    <input
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="Team Name"
                        required
                        className="input"
                    />
                    <button type="submit" className="btn w-full">Create</button>
                </form>
            </div>
        </div>
    );
}
