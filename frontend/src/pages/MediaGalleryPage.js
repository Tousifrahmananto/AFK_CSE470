// frontend/src/pages/MediaGalleryPage.js
import React, { useEffect, useState } from "react";
import { listVideos } from "../services/mediaService";
import AdSlot from "../components/AdSlot";

export default function MediaGalleryPage() {
    const [q, setQ] = useState("");
    const [game, setGame] = useState("");
    const [category, setCategory] = useState("");
    const [videos, setVideos] = useState([]);

    const load = async () => {
        const v = await listVideos({ q, game, category });
        setVideos(v || []);
    };
    useEffect(() => { load(); /* eslint-disable-next-line */ }, []);
    useEffect(() => { load(); /* eslint-disable-next-line */ }, [q, game, category]);

    return (
        <div style={{ padding: "16px", color: "#e8ecf2", background: "#0f1115", minHeight: "100vh" }}>
            <h2>Live & Media</h2>

            <div style={{
                display: "grid", gridTemplateColumns: "1fr 180px 180px", gap: 10,
                background: "#151922", border: "1px solid #232838", padding: 12, borderRadius: 12
            }}>
                <input placeholder="Search videos…" value={q} onChange={(e) => setQ(e.target.value)} />
                <input placeholder="Game" value={game} onChange={(e) => setGame(e.target.value)} />
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="">All Categories</option>
                    {["Full Match", "Highlight", "Interview", "Recap"].map(c => <option key={c}>{c}</option>)}
                </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: 16, marginTop: 16 }}>
                <div>
                    <h3>Videos</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
                        {videos.map(v => (
                            <div key={v._id} style={{ background: "#151922", border: "1px solid #232838", padding: 10, borderRadius: 10 }}>
                                <div style={{ fontWeight: 700 }}>{v.title}</div>
                                <div style={{ fontSize: 12, opacity: .8 }}>{v.category} · {v.game || "—"}</div>
                                {v.thumbnailUrl && <img src={v.thumbnailUrl} alt="" style={{ width: "100%", borderRadius: 8, marginTop: 8 }} />}
                                {v.externalUrl ? (
                                    <a href={v.externalUrl} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 8 }}>Watch</a>
                                ) : v.filePath ? (
                                    <video src={v.filePath} controls style={{ width: "100%", marginTop: 8, borderRadius: 8 }} />
                                ) : null}
                            </div>
                        ))}
                        {videos.length === 0 && <div style={{ opacity: .7 }}>No videos found.</div>}
                    </div>
                </div>

                {/* Right rail ads */}
                <div>
                    <AdSlot category="Gallery" game={game} />
                    <div style={{ height: 12 }} />
                    <AdSlot category="Sidebar" game={game} />
                </div>
            </div>
        </div>
    );
}
