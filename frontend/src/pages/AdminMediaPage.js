// frontend/src/pages/admin/AdminMediaPage.js
import React, { useEffect, useState } from "react";
import { createVideo, deleteVideo, listVideos } from "../services/mediaService";

export default function AdminMediaPage() {
    const [list, setList] = useState([]);
    const [file, setFile] = useState(null);
    const [form, setForm] = useState({
        tournament: "", matchId: "", title: "", description: "",
        category: "Full Match", game: "", tags: "",
        externalUrl: "", thumbnailUrl: "", visibility: "Public",
    });

    const load = async () => setList(await listVideos());

    useEffect(() => { load(); }, []);

    const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const onSubmit = async (e) => {
        e.preventDefault();
        await createVideo({ ...form, file });
        setForm({ ...form, title: "", description: "", externalUrl: "", thumbnailUrl: "", tags: "" });
        setFile(null);
        await load();
        alert("Video saved");
    };

    const onDelete = async (id) => {
        if (!window.confirm("Delete this video?")) return;
        await deleteVideo(id);
        await load();
    };
    // const onUploadVideos = async () => {
    //     if (!videos || videos.length === 0) return alert("Pick at least one video");
    //     const fd = new FormData();
    //     Array.from(videos).forEach((f) => fd.append("files", f)); // <-- field name 'files'
    //     try {
    //         await uploadMatchMedia(tid, r, m, fd, token);
    //         await refresh(); // re-fetch list
    //     } catch (e) {
    //         alert("Upload failed.");
    //     }
    // };
    // const onUploadImages = async () => {
    //     if (!images || images.length === 0) return alert("Pick at least one image");
    //     const fd = new FormData();
    //     Array.from(images).forEach((f) => fd.append("files", f)); // <-- field name 'files'
    //     try {
    //         await uploadMatchMedia(tid, r, m, fd, token);
    //         await refresh();
    //     } catch (e) {
    //         alert("Upload failed.");
    //     }
    // };
    return (
        <div style={{ padding: "16px", color: "#e8ecf2", background: "#0f1115", minHeight: "100vh" }}>
            <h2>Admin · Media Manager</h2>

            <div style={{ background: "#151922", border: "1px solid #232838", borderRadius: 12, padding: 12 }}>
                <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
                    <input name="tournament" placeholder="Tournament ID" value={form.tournament} onChange={onChange} />
                    <input name="matchId" placeholder="Match ID (optional)" value={form.matchId} onChange={onChange} />
                    <input name="title" placeholder="Title" value={form.title} onChange={onChange} required />
                    <textarea name="description" placeholder="Description" value={form.description} onChange={onChange} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                        <select name="category" value={form.category} onChange={onChange}>
                            {["Full Match", "Highlight", "Interview", "Recap"].map(c => <option key={c}>{c}</option>)}
                        </select>
                        <input name="game" placeholder="Game (optional)" value={form.game} onChange={onChange} />
                        <select name="visibility" value={form.visibility} onChange={onChange}>
                            {["Public", "Unlisted", "Private"].map(v => <option key={v}>{v}</option>)}
                        </select>
                    </div>
                    <input name="tags" placeholder="Tags (comma separated)" value={form.tags} onChange={onChange} />
                    <input name="externalUrl" placeholder="External URL (YouTube/Twitch VOD)" value={form.externalUrl} onChange={onChange} />
                    <input name="thumbnailUrl" placeholder="Thumbnail URL" value={form.thumbnailUrl} onChange={onChange} />
                    <input type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                    <button type="submit">Save</button>
                </form>
            </div>

            <h3 style={{ marginTop: 16 }}>Videos</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
                {list.map(v => (
                    <div key={v._id} style={{ background: "#151922", border: "1px solid #232838", borderRadius: 10, padding: 10 }}>
                        <div style={{ fontWeight: 700 }}>{v.title}</div>
                        <div style={{ fontSize: 12, opacity: .8 }}>{v.category} · {v.visibility}</div>
                        {v.thumbnailUrl && <img src={v.thumbnailUrl} style={{ width: "100%", borderRadius: 8, marginTop: 8 }} alt="thumb" />}
                        {v.externalUrl && <a href={v.externalUrl} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 8 }}>Open External</a>}
                        {v.filePath && <video src={v.filePath} controls style={{ width: "100%", marginTop: 8, borderRadius: 8 }} />}
                        <button onClick={() => onDelete(v._id)} style={{ marginTop: 8 }}>Delete</button>
                    </div>
                ))}
            </div>
        </div>
    );
}
