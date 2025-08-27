import React, { useState } from "react";
import { register } from "../services/authService";
import { useNavigate } from "react-router-dom";

export default function RegisterPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
        role: "Player", // always Player
    });

    const onChange = (e) =>
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const onSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(form);
            alert("Registration successful. Please login.");
            navigate("/login");
        } catch (err) {
            alert(err.message || "Registration failed");
        }
    };

    return (
        <div style={wrap}>
            <div style={card}>
                <h2 style={{ margin: "0 0 12px 0" }}>Create your account</h2>
                <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
                    <input
                        name="username"
                        placeholder="Username"
                        required
                        onChange={onChange}
                        style={input}
                    />
                    <input
                        name="email"
                        type="email"
                        placeholder="Email"
                        required
                        onChange={onChange}
                        style={input}
                    />
                    <input
                        name="password"
                        type="password"
                        placeholder="Password"
                        required
                        onChange={onChange}
                        style={input}
                    />

                    {/* Role is fixed to Player, no dropdown shown */}
                    <input
                        type="hidden"
                        name="role"
                        value="Player"
                    />

                    <button type="submit" style={btn}>
                        Register
                    </button>
                </form>
                <div style={{ fontSize: 12, opacity: 0.8, marginTop: 8 }}>
                    All public registrations are as <b>Player</b>.
                    Admin & Team Manager are assigned by administrators.
                </div>
            </div>
        </div>
    );
}

const wrap = {
    minHeight: "100vh",
    background: "#0f1115",
    display: "grid",
    placeItems: "center",
    padding: 16,
};
const card = {
    width: "100%",
    maxWidth: 420,
    background: "#151922",
    border: "1px solid #232838",
    borderRadius: 12,
    padding: 20,
    color: "#e8ecf2",
};
const input = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    background: "#0f1320",
    border: "1px solid #232838",
    color: "#e8ecf2",
};
const btn = {
    padding: "10px 12px",
    borderRadius: 10,
    background: "#1f6feb",
    color: "#fff",
    border: 0,
    cursor: "pointer",
};
