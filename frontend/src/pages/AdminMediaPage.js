// frontend/src/pages/admin/AdminMediaPage.js
import React, { useContext, useEffect, useState, useMemo } from "react";
import { AuthContext } from "../context/AuthContext";
import {
    fetchMedia,       // GET /api/media
    createMedia,      // POST /api/media
    deleteMedia       // DELETE /api/media/:id
} from "../services/mediaService";

/**
 * Build the backend origin for static files:
 * - If REACT_APP_API = http://localhost:5000/api -> origin = http://localhost:5000
 * - Else try swapping :3000 -> :5000 as a sane default for local dev
 */
function computeApiOrigin() {
    const env = process.env.REACT_APP_API || "";
    if (env) {
        // strip trailing /api or /api/
        return env.replace(/\/api\/?$/i, "");
    }
    // fallback (cra-friendly local dev)
    try {
        const { origin } = window.location;
        return origin.replace(":3000", ":5000");
    } catch {
        return "http://localhost:5000";
    }
}

export default function AdminMediaPage() {
    const { token } = useContext(AuthContext);

    const API_ORIGIN = useMemo(() => computeApiOrigin(), []);
    const toUrl = (p) => {
        if (!p) return "";
        // if already absolute, keep it
        if (/^https?:\/\//i.test(p)) return p;
        // expect server to serve: app.use("/uploads", express.static(...))
        return `${API_ORIGIN}${p.startsWith("/") ? "" : "/"}${p}`;
    };

    // shared fields for both image/video uploads
    const [form, setForm] = useState({
        tournament: "",
        matchId: "",
        title: "",
        description: "",
        category: "Full Match",
        game: "",
        tags: "",
        externalUrl: "",
        thumbnailUrl: "",
        visibility: "Public",
    });

    // choose which kind we are uploading this time
    const [kind, setKind] = useState("video"); // "video" | "image"
    const [file, setFile] = useState(null);

    // library list (both kinds)
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const data = await fetchMedia({}, token);
            setItems(Array.isArray(data) ? data : []);
        } catch (e) {
            const msg = e?.response?.data?.message || e.message || "Failed to load media.";
            alert(msg);
            console.error("fetchMedia error:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load(); // on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!form.tournament) return alert("Tournament ID is required");
        if (!form.title) return alert("Title is required");
        if (!file && !form.externalUrl) {
            return alert("Choose a file or provide an External URL");
        }
        try {
            await createMedia(
                {
                    file, // optional
                    fields: {
                        ...form,
                        kind, // "image" or "video"
                    },
                },
                token
            );

            // reset a few fields for convenience
            setForm((f) => ({
                ...f,
                title: "",
                description: "",
                externalUrl: "",
                thumbnailUrl: "",
                tags: "",
            }));
            setFile(null);
            await load();
            alert(`Saved ${kind}`);
        } catch (err) {
            const msg = err?.response?.data?.message || err.message || "Failed to save media";
            alert(msg);
            console.error("createMedia error:", err);
        }
    };

    const onDelete = async (id) => {
        if (!window.confirm("Delete this media item?")) return;
        try {
            await deleteMedia(id, token);
            await load();
        } catch (err) {
            const msg = err?.response?.data?.message || err.message || "Failed to delete media";
            alert(msg);
            console.error("deleteMedia error:", err);
        }
    };

    const card = {
        background: "#151922",
        border: "1px solid #232838",
        borderRadius: 12,
        padding: 12,
    };

    return (
        <div style={{ padding: 16, color: "#e8ecf2", background: "#0f1115", minHeight: "100vh" }}>
            <h2>Admin · Media Manager</h2>

            {/* Upload card */}
            <div style={{ ...card, marginBottom: 14 }}>
                <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
                    <div style={{ display: "flex", gap: 10 }}>
                        <label className="pill">
                            <input
                                type="radio"
                                name="kind"
                                value="video"
                                checked={kind === "video"}
                                onChange={() => setKind("video")}
                            />{" "}
                            Video
                        </label>
                        <label className="pill">
                            <input
                                type="radio"
                                name="kind"
                                value="image"
                                checked={kind === "image"}
                                onChange={() => setKind("image")}
                            />{" "}
                            Image
                        </label>
                    </div>

                    <input
                        name="tournament"
                        placeholder="Tournament ID (required)"
                        value={form.tournament}
                        onChange={onChange}
                        required
                    />
                    <input
                        name="matchId"
                        placeholder='Match ID (optional, e.g. "r=0&m=1")'
                        value={form.matchId}
                        onChange={onChange}
                    />
                    <input
                        name="title"
                        placeholder="Title (required)"
                        value={form.title}
                        onChange={onChange}
                        required
                    />
                    <textarea
                        name="description"
                        placeholder="Description"
                        value={form.description}
                        onChange={onChange}
                    />

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                        <select name="category" value={form.category} onChange={onChange}>
                            {["Full Match", "Highlight", "Interview", "Recap", "General"].map((c) => (
                                <option key={c}>{c}</option>
                            ))}
                        </select>
                        <input name="game" placeholder="Game (optional)" value={form.game} onChange={onChange} />
                        <select name="visibility" value={form.visibility} onChange={onChange}>
                            {["Public", "Unlisted", "Private"].map((v) => (
                                <option key={v}>{v}</option>
                            ))}
                        </select>
                    </div>

                    <input
                        name="tags"
                        placeholder="Tags (comma separated)"
                        value={form.tags}
                        onChange={onChange}
                    />
                    <input
                        name="externalUrl"
                        placeholder="External URL (YouTube/Twitch VOD or CDN)"
                        value={form.externalUrl}
                        onChange={onChange}
                    />
                    <input
                        name="thumbnailUrl"
                        placeholder="Thumbnail URL (optional)"
                        value={form.thumbnailUrl}
                        onChange={onChange}
                    />

                    {/* accept depends on kind */}
                    <input
                        key={kind} // reset chosen file when switching kind
                        type="file"
                        accept={kind === "image" ? "image/*" : "video/*"}
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />

                    <button type="submit">Save {kind === "image" ? "Image" : "Video"}</button>
                </form>
            </div>

            {/* Library list (both kinds) */}
            <h3 style={{ marginTop: 8 }}>Library</h3>
            {loading && <div>Loading…</div>}
            {!loading && items.length === 0 && <div>No media yet.</div>}

            {!loading && items.length > 0 && (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                        gap: 12,
                    }}
                >
                    {items.map((m) => (
                        <div
                            key={m._id}
                            style={{
                                background: "#151922",
                                border: "1px solid #232838",
                                borderRadius: 10,
                                padding: 10,
                            }}
                        >
                            <div style={{ fontWeight: 700 }}>
                                {m.title}{" "}
                                <span
                                    style={{
                                        fontWeight: 400,
                                        fontSize: 12,
                                        padding: "2px 6px",
                                        border: "1px solid #2a3350",
                                        borderRadius: 999,
                                        marginLeft: 6,
                                        background: "#101523",
                                    }}
                                >
                                    {m.kind}
                                </span>
                            </div>
                            <div style={{ fontSize: 12, opacity: 0.8 }}>
                                {m.category || "—"} · {m.visibility || "Public"}
                            </div>

                            {/* Show preview depending on kind */}
                            {m.kind === "image" && (m.filePath || m.externalUrl) && (
                                <img
                                    src={toUrl(m.filePath || m.externalUrl)}
                                    alt={m.title}
                                    style={{ width: "100%", borderRadius: 8, marginTop: 8 }}
                                />
                            )}
                            {m.kind === "video" && (m.filePath || m.externalUrl) && (
                                <video
                                    src={toUrl(m.filePath || m.externalUrl)}
                                    controls
                                    style={{ width: "100%", marginTop: 8, borderRadius: 8, background: "#000" }}
                                />
                            )}
                            {m.externalUrl && (
                                <a
                                    href={m.externalUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ display: "inline-block", marginTop: 8 }}
                                >
                                    Open External
                                </a>
                            )}

                            <button onClick={() => onDelete(m._id)} style={{ marginTop: 8 }}>
                                Delete
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
