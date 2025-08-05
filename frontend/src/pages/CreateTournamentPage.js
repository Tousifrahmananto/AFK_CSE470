import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

const CreateTournamentPage = () => {
    const { user, token } = useContext(AuthContext);
    const navigate = useNavigate();
    const [data, setData] = useState({
        title: "", game: "", format: "Single Elimination",
        startDate: "", endDate: "", maxPlayers: 8
    });

    if (user?.role !== "Admin") {
        return <div className="text-center">Access denied.</div>;
    }

    const handleChange = (e) =>
        setData({ ...data, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(
                "http://localhost:5000/api/tournaments/create",
                data,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("Created!");
            navigate("/tournaments");
        } catch {
            alert("Failed to create tournament");
        }
    };

    return (
        <div className="container">
            <div className="card" style={{ maxWidth: 500, margin: "auto" }}>
                <h2>Create Tournament</h2>
                <form onSubmit={handleSubmit}>
                    <input name="title" placeholder="Title" onChange={handleChange} className="input" required />
                    <input name="game" placeholder="Game" onChange={handleChange} className="input" required />
                    <select name="format" onChange={handleChange} className="input">
                        <option>Single Elimination</option>
                        <option>Double Elimination</option>
                        <option>Round Robin</option>
                    </select>
                    <input type="date" name="startDate" onChange={handleChange} className="input" required />
                    <input type="date" name="endDate" onChange={handleChange} className="input" required />
                    <input type="number" name="maxPlayers"
                        min="2" placeholder="Max Players"
                        onChange={handleChange} className="input" required />
                    <button type="submit" className="btn">Create</button>
                </form>
            </div>
        </div>
    );
};

export default CreateTournamentPage;
