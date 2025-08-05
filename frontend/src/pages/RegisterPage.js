import React, { useState } from "react";
import { register } from "../services/authService";
import { useNavigate } from "react-router-dom";

const RegisterPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        role: "Player"   // default
    });

    const handleChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(formData);
            alert("Registration successful!");
            navigate("/login");
        } catch (err) {
            alert(err.response?.data?.message || "Registration failed");
        }
    };

    return (
        <div className="container">
            <div className="card">
                <h2>Register</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        name="username"
                        placeholder="Username"
                        required
                        onChange={handleChange}
                        className="input"
                    />
                    <input
                        name="email"
                        type="email"
                        placeholder="Email"
                        required
                        onChange={handleChange}
                        className="input"
                    />
                    <input
                        name="password"
                        type="password"
                        placeholder="Password"
                        required
                        onChange={handleChange}
                        className="input"
                    />
                    <select
                        name="role"
                        onChange={handleChange}
                        className="input"
                        value={formData.role}
                    >
                        <option value="Player">Player</option>
                        <option value="TeamManager">Team Manager</option>
                        <option value="Admin">Admin</option> {/* testing only */}
                    </select>
                    <button type="submit" className="btn">Register</button>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;
