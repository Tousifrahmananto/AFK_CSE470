// src/services/userService.js
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export async function getUserById(id) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No auth token");

    const res = await axios.get(`${API_BASE}/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data; // includes { joinedTournaments } now
}

export async function getMyTournaments() {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No auth token");

    const res = await axios.get(`${API_BASE}/users/me/tournaments`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data; // [{ _id, title, game, bracket, status, startDate, mode }, ...]
}
