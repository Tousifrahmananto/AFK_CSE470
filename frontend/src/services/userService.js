// src/services/userService.js
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

export async function getUserById(id) {
  const { data } = await axios.get(`${API_BASE}/users/${id}`, { headers: authHeaders() });
  // data is { ...user(with team object), joinedTournaments: [...] }
  return data;
}

export async function getMeProfile() {
  const { data } = await axios.get(`${API_BASE}/users/me/profile`, { headers: authHeaders() });
  // data is { user, tournaments }
  return data;
}

export async function getMyTournaments() {
  const { data } = await axios.get(`${API_BASE}/users/me/tournaments`, { headers: authHeaders() });
  return data;
}
