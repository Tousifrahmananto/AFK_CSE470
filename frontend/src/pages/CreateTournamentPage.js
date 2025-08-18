import React, { useContext, useEffect, useMemo, useState } from "react";
import {
    getAllTournaments,
    createTournament,
    updateTournament,
    deleteTournament,
    toggleRegistration,
    generateBracket,
} from "../services/tournamentService";
import { AuthContext } from "../context/AuthContext";

const BRACKETS = ["Single Elimination", "Double Elimination", "Round Robin"];
const STATUSES = ["Upcoming", "Live", "Completed"];

const emptyForm = {
    title: "",
    game: "",
    bracket: "Single Elimination",
    registrationDeadline: "",
    startDate: "",
    endDate: "",
    playerLimit: 0,
    teamLimit: 0,
    status: "Upcoming",
    registrationOpen: true,
    description: "",
    rules: "",
    location: "",
    prizePool: "",
    entryFee: "",
};

export default function CreateTournamentPage() {
    const { user, token } = useContext(AuthContext);
    const isAdmin = user?.role === "Admin";

    const [form, setForm] = useState(emptyForm);
    const [list, setList] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);

    const canSubmit = useMemo(() => {
        if (!form.title || !form.game || !form.bracket) return false;
        if (!form.registrationDeadline || !form.startDate || !form.endDate) return false;
        return true;
    }, [form]);

    const load = async () => {
        setLoading(true);
        try {
            const data = await getAllTournaments({}, token);
            setList(data);
        } catch (e) {
            console.error(e);
            alert("Failed to load tournaments");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); /* eslint-disable-next-line */ }, [token]);

    const onChange = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
    };

    const onCreate = async (e) => {
        e.preventDefault();
        if (!isAdmin) return alert("Only admin can create tournaments.");
        if (!canSubmit) return alert("All fields are required");
        try {
            await createTournament(form, token);
            setForm(emptyForm);
            await load();
        } catch (err) {
            alert(err?.response?.data?.message || "Failed to create tournament");
        }
    };

    const onEdit = (t) => {
        setEditingId(t._id);
        setForm({
            title: t.title || "",
            game: t.game || "",
            bracket: t.bracket || "Single Elimination",
            registrationDeadline: t.registrationDeadline ? t.registrationDeadline.slice(0, 10) : "",
            startDate: t.startDate ? t.startDate.slice(0, 10) : "",
            endDate: t.endDate ? t.endDate.slice(0, 10) : "",
            playerLimit: t.playerLimit ?? 0,
            teamLimit: t.teamLimit ?? 0,
            status: t.status || "Upcoming",
            registrationOpen: t.registrationOpen !== false,
            description: t.description || "",
            rules: t.rules || "",
            location: t.location || "",
            prizePool: t.prizePool || "",
            entryFee: t.entryFee || "",
        });
    };

    const onUpdate = async () => {
        if (!editingId) return;
        try {
            await updateTournament(editingId, form, token);
            setEditingId(null);
            setForm(emptyForm);
            await load();
        } catch (err) {
            alert(err?.response?.data?.message || "Failed to update tournament");
        }
    };

    const onDelete = async (id) => {
        if (!window.confirm("Delete this tournament?")) return;
        try {
            await deleteTournament(id, token);
            await load();
        } catch (err) {
            alert(err?.response?.data?.message || "Failed to delete");
        }
    };

    const onToggleReg = async (id) => {
        try {
            await toggleRegistration(id, token);
            await load();
        } catch (err) {
            alert(err?.response?.data?.message || "Failed to toggle registration");
        }
    };

    const onGenerate = async (id) => {
        try {
            await generateBracket(id, token);
            alert("Bracket generated");
        } catch (err) {
            alert(err?.response?.data?.message || "Failed to generate bracket");
        }
    };

    if (!isAdmin) {
        return <div className="container mt-8">Only Admin can access this page.</div>;
    }

    return (
        <div className="container mt-8">
            <h1 className="text-3xl font-bold mb-6">Create Tournament</h1>

            {/* Form */}
            <form onSubmit={onCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <input className="input" name="title" placeholder="Title" value={form.title} onChange={onChange} />
                <input className="input" name="game" placeholder="Game" value={form.game} onChange={onChange} />

                <select className="input" name="bracket" value={form.bracket} onChange={onChange}>
                    {BRACKETS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>

                <input className="input" type="date" name="registrationDeadline" value={form.registrationDeadline} onChange={onChange} />
                <input className="input" type="date" name="startDate" value={form.startDate} onChange={onChange} />
                <input className="input" type="date" name="endDate" value={form.endDate} onChange={onChange} />

                <input className="input" name="playerLimit" type="number" min="0" placeholder="Solo player limit (0 = disabled)"
                    value={form.playerLimit} onChange={onChange} />
                <input className="input" name="teamLimit" type="number" min="0" placeholder="Team limit (0 = disabled)"
                    value={form.teamLimit} onChange={onChange} />

                <select className="input" name="status" value={form.status} onChange={onChange}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>

                <select className="input" name="registrationOpen" value={String(form.registrationOpen)} onChange={(e) => setForm(f => ({ ...f, registrationOpen: e.target.value === "true" }))}>
                    <option value="true">Registration Open</option>
                    <option value="false">Registration Closed</option>
                </select>

                <input className="input md:col-span-2" name="description" placeholder="Description" value={form.description} onChange={onChange} />
                <input className="input md:col-span-2" name="rules" placeholder="Rules" value={form.rules} onChange={onChange} />
                <input className="input" name="location" placeholder="Location" value={form.location} onChange={onChange} />
                <input className="input" name="prizePool" placeholder="Prize Pool" value={form.prizePool} onChange={onChange} />
                <input className="input" name="entryFee" placeholder="Entry Fee" value={form.entryFee} onChange={onChange} />

                {!editingId ? (
                    <button type="submit" className="btn md:col-span-2" disabled={!canSubmit}>Create</button>
                ) : (
                    <div className="md:col-span-2 flex gap-2">
                        <button type="button" className="btn" onClick={onUpdate} disabled={!canSubmit}>Update</button>
                        <button type="button" className="btn btn-secondary" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel</button>
                    </div>
                )}
            </form>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left opacity-70">
                            <th className="py-2 pr-4">Title</th>
                            <th className="py-2 pr-4">Game</th>
                            <th className="py-2 pr-4">Bracket</th>
                            <th className="py-2 pr-4">Reg. Deadline</th>
                            <th className="py-2 pr-4">Start</th>
                            <th className="py-2 pr-4">End</th>
                            <th className="py-2 pr-4">Solo/Team</th>
                            <th className="py-2 pr-4">Status</th>
                            <th className="py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr><td colSpan="9" className="py-6">Loading…</td></tr>
                        )}
                        {!loading && list.map((t) => (
                            <tr key={t._id} className="border-t border-[#22263a]">
                                <td className="py-2 pr-4">{t.title}</td>
                                <td className="py-2 pr-4">{t.game}</td>
                                <td className="py-2 pr-4">{t.bracket}</td>
                                <td className="py-2 pr-4">{t.registrationDeadline ? new Date(t.registrationDeadline).toLocaleDateString() : "-"}</td>
                                <td className="py-2 pr-4">{t.startDate ? new Date(t.startDate).toLocaleDateString() : "-"}</td>
                                <td className="py-2 pr-4">{t.endDate ? new Date(t.endDate).toLocaleDateString() : "-"}</td>
                                <td className="py-2 pr-4">
                                    {t.playerLimit ?? 0}/{t.soloCount ?? 0} solo • {t.teamLimit ?? 0}/{t.teamCount ?? 0} teams
                                </td>
                                <td className="py-2 pr-4">{t.status}</td>
                                <td className="py-2 flex flex-wrap gap-2">
                                    <button className="btn btn-secondary" onClick={() => onEdit(t)}>Edit</button>
                                    <button className="btn btn-danger" onClick={() => onDelete(t._id)}>Delete</button>
                                    <button className="btn" onClick={() => onToggleReg(t._id)}>
                                        {t.registrationOpen === false ? "Open Reg" : "Close Reg"}
                                    </button>
                                    <button className="btn" onClick={() => onGenerate(t._id)}>Generate Bracket</button>
                                </td>
                            </tr>
                        ))}
                        {!loading && list.length === 0 && (
                            <tr><td colSpan="9" className="py-6">No tournaments.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
