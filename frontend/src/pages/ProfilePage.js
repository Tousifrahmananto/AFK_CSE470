// src/pages/ProfilePage.js
import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getUserById, getMyTournaments } from "../services/userService";
import ProfileCard from "../components/ProfileCard";

const ProfilePage = () => {
    const { id } = useParams();
    const { token } = useContext(AuthContext);

    const [profile, setProfile] = useState(null);
    const [myTournaments, setMyTournaments] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!token) {
            setError("You must be logged in to view profiles");
            return;
        }

        getUserById(id)
            .then((u) => setProfile(u))
            .catch((err) => {
                console.error("Profile fetch error:", err);
                setError(err.response?.data?.message || err.message);
            });

        getMyTournaments()
            .then((items) => setMyTournaments(items))
            .catch((err) => {
                console.error("My tournaments fetch error:", err);
                setMyTournaments([]);
            });
    }, [id, token]);

    if (error) {
        return <div className="text-center mt-10 text-red-400">{error}</div>;
    }
    if (!profile) {
        return <div className="text-center mt-10">Loading profile…</div>;
    }

    // Single-column profile page (no right sidebar)
    return (
        <div className="container mt-6">
            <ProfileCard user={profile} myTournaments={myTournaments} />
        </div>
    );
};

export default ProfilePage;
