// src/components/ProfileCard.js
import React from "react";

const ProfileCard = ({ user, myTournaments = [] }) => {
  const fmt = (d) => (d ? new Date(d).toLocaleDateString() : "—");

  return (
    <div className="card" style={{ maxWidth: 700, margin: "auto" }}>
      <h2 className="text-3xl font-bold text-center mb-4">{user.username}</h2>

      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Role:</strong> {user.role}</p>
      <p><strong>Country:</strong> {user.country || "N/A"}</p>
      <p><strong>Team:</strong> {user.team || "N/A"}</p>
      <p><strong>K/D Ratio:</strong> {user.stats?.kdr ?? "N/A"}</p>
      <p><strong>Win Rate:</strong> {user.stats?.winRate ?? "N/A"}</p>

      {/* The only tournaments section */}
      <div className="mt-4">
        <strong>Tournaments:</strong>{" "}
        {myTournaments.length === 0 ? (
          "None"
        ) : (
          <ul className="list-disc ml-5 mt-2 space-y-1">
            {myTournaments.map((t) => (
              <li key={t._id}>
                <span className="font-medium">{t.title}</span>{" "}
                <span className="opacity-80">({t.mode})</span> • {t.game} • {t.bracket} • starts {fmt(t.startDate)} • status {t.status}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ProfileCard;
