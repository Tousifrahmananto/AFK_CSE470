// src/components/ProfileCard.js
import React from "react";

const ProfileCard = ({ user }) => (
  <div className="card" style={{ maxWidth: 500, margin: "auto" }}>
    <h2 className="text-3xl font-bold text-center mb-4">{user.username}</h2>
    <p><strong>Email:</strong> {user.email}</p>
    <p><strong>Role:</strong> {user.role}</p>
    <p><strong>Country:</strong> {user.country || "N/A"}</p>
    <p><strong>Team:</strong> {user.team || "N/A"}</p>
    <p><strong>K/D Ratio:</strong> {user.stats?.kdr ?? "N/A"}</p>
    <p><strong>Win Rate:</strong> {user.stats?.winRate ?? "N/A"}</p>
    <p>
      <strong>Tournaments:</strong>{" "}
      {user.tournaments?.length
        ? user.tournaments.join(", ")
        : "None"}
    </p>
  </div>
);

export default ProfileCard;
