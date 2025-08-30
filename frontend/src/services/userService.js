// src/services/userService.js
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// pull token the same way the rest of your app does
const authHeaders = (token) =>
  token
    ? { Authorization: `Bearer ${token}` }
    : { Authorization: `Bearer ${localStorage.getItem("token")}` };

/* ---------------- core profile bits (unchanged) ---------------- */
export async function getUserById(id, token) {
  const { data } = await axios.get(`${API_BASE}/users/${id}`, {
    headers: authHeaders(token),
  });
  return data;
}

export async function getMeProfile(token) {
  const { data } = await axios.get(`${API_BASE}/users/me/profile`, {
    headers: authHeaders(token),
  });
  return data; // { user, tournaments }
}

export async function getMyTournaments(token) {
  const { data } = await axios.get(`${API_BASE}/users/me/tournaments`, {
    headers: authHeaders(token),
  });
  return data;
}

/* ---------------- moderation (back-compat + new) --------------- */
/** Back-compat: your page used this name first. Now it accepts
 * optional filter params and token, and uses the new endpoint.
 */
export async function adminListUsers(paramsOrToken = {}, token) {
  let params = {};
  if (typeof paramsOrToken === "string") {
    token = paramsOrToken;
  } else {
    params = paramsOrToken || {};
  }
  const { data } = await axios.get(`${API_BASE}/users/moderation`, {
    params,
    headers: authHeaders(token),
  });
  return data; // array of users
}

/** Explicit “new” list function (identical to above) */
export async function adminListUsersModeration(params = {}, token) {
  const { data } = await axios.get(`${API_BASE}/users/moderation`, {
    params,
    headers: authHeaders(token),
  });
  return data;
}

/** Soft-ban (reason optional). */
export async function adminBanUser(id, token, reason = "") {
  const { data } = await axios.post(
    `${API_BASE}/users/${id}/soft-ban`,
    { reason },
    { headers: authHeaders(token) }
  );
  return data;
}

/** Unban */
export async function adminUnbanUser(id, token) {
  const { data } = await axios.post(
    `${API_BASE}/users/${id}/unban`,
    {},
    { headers: authHeaders(token) }
  );
  return data;
}

/** Optional single toggle (kept so you can call either path) */
export async function adminToggleBan(id, { reason = "" } = {}, token) {
  const { data } = await axios.post(
    `${API_BASE}/users/${id}/ban-toggle`,
    { reason },
    { headers: authHeaders(token) }
  );
  return data;
}
