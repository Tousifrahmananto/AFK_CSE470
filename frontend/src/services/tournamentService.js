// src/services/tournamentService.js
import axios from "axios";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Fetch list of all tournaments
export async function getAllTournaments() {
    const res = await axios.get(`${API}/tournaments`);
    return res.data;
}

// Solo registration
export async function registerSolo(tournamentId, token) {
    return axios.post(
        `${API}/tournaments/${tournamentId}/register-solo`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
    );
}

// Team registration
export async function registerTeam(tournamentId, token) {
    return axios.post(
        `${API}/tournaments/${tournamentId}/register-team`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
    );
}
