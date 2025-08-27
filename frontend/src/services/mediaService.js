// frontend/src/services/mediaService.js
import axios from "axios";

const API = process.env.REACT_APP_API || "http://localhost:5000/api";

/* -----------------------------
   Global Media Library (videos)
   Used by: AdminMediaPage, MediaGalleryPage
-------------------------------- */

// GET /api/media/videos
export async function listVideos(token) {
    const res = await axios.get(`${API}/media/videos`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    // Expected shape: [{ _id, url, originalName, uploadedBy, uploadedAt }, ...]
    return res.data;
}

// POST /api/media/videos  (multipart: field name "file")
export async function createVideo(file, token) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await axios.post(`${API}/media/videos`, fd, {
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "Content-Type": "multipart/form-data",
        },
    });
    return res.data; // created video doc or {message,...}
}

// DELETE /api/media/videos/:id
export async function deleteVideo(id, token) {
    const res = await axios.delete(`${API}/media/videos/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data; // { message: "deleted" }
}

/* ---------------------------------
   Per-Match Media (videos & images)
   Used by: AdminMatchMediaPage
---------------------------------- */

// GET /api/tournaments/:id/matches/:r/:m/media
export async function listMatchMedia(tournamentId, r, m, token) {
    const res = await axios.get(
        `${API}/tournaments/${tournamentId}/matches/${r}/${m}/media`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
    // { title, media: { videos:[], images:[] } }
    return res.data;
}

// POST /api/tournaments/:id/matches/:r/:m/media  (multipart: field name "files")
export async function uploadMatchMedia(tournamentId, r, m, kind, files, token) {
    // kind ∈ {"video","image"}
    const fd = new FormData();
    fd.append("kind", kind);
    for (const f of files) fd.append("files", f);
    const res = await axios.post(
        `${API}/tournaments/${tournamentId}/matches/${r}/${m}/media`,
        fd,
        {
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                "Content-Type": "multipart/form-data",
            },
        }
    );
    return res.data; // { message, media }
}

// DELETE /api/tournaments/:id/matches/:r/:m/media  (body: { kind, url })
export async function deleteMatchMedia(tournamentId, r, m, kind, url, token) {
    const res = await axios.delete(
        `${API}/tournaments/${tournamentId}/matches/${r}/${m}/media`,
        {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            data: { kind, url },
        }
    );
    return res.data; // { message, media }
}
