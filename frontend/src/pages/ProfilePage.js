import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getUserById } from "../services/userService";
import ProfileCard from "../components/ProfileCard";

const ProfilePage = () => {
    const { id } = useParams();
    const { token } = useContext(AuthContext);
    const [profile, setProfile] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!token) {
            setError("You must be logged in to view profiles");
            return;
        }
        getUserById(id)
            .then(setProfile)
            .catch((err) => {
                console.error("Profile fetch error:", err);
                setError(err.response?.data?.message || err.message);
            });
    }, [id, token]);

    if (error) {
        return <div className="text-center mt-10 text-red-400">{error}</div>;
    }
    if (!profile) {
        return <div className="text-center mt-10">Loading profile…</div>;
    }

    return (
        <div className="container">
            <ProfileCard user={profile} />

            {/* Add tournaments section */}
            <div className="mt-6">
                <h3 className="text-2xl font-semibold mb-2">My Tournaments</h3>
                {profile.tournaments && profile.tournaments.length > 0 ? (
                    <ul className="space-y-1">
                        {profile.tournaments.map((tournament) => (
                            <li key={tournament._id}>
                                {tournament.title} ({tournament.game}) –{" "}
                                {new Date(tournament.startDate).toLocaleDateString()} ({tournament.status})
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>None</p>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;
