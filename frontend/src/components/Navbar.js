// src/components/Navbar.js
import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const onLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <nav className="navbar">
            <div className="nav-left">
                {user && (
                    <>
                        <Link to="/tournaments">Tournaments</Link>
                        {user.role === "Admin" && (
                            <Link to="/admin/create-tournament">Create Tournament</Link>
                        )}
                        {user?.role === "TeamManager" && (
                            <>
                                <Link to="/teams/create">Create Team</Link>
                                <Link to="/teams/my">My Team</Link>
                            </>
                        )}
                    </>
                )}
            </div>
            <div className="nav-right">
                {user ? (
                    <>
                        <Link to={`/profile/${user._id}`}>My Profile</Link>
                        <button onClick={onLogout}>Logout</button>
                    </>
                ) : (
                    <>
                        <Link to="/login">Login</Link>
                        <Link to="/register">Register</Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
