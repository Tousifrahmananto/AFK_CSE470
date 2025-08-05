import React from "react";

const TournamentCard = ({ tournament }) => (
    <div className="card" style={{ marginBottom: "1rem" }}>
        <h3 style={{ fontWeight: "bold" }}>{tournament.title}</h3>
        <p><strong>Game:</strong> {tournament.game}</p>
        <p><strong>Format:</strong> {tournament.format}</p>
        <p>
            <strong>Start:</strong>{" "}
            {new Date(tournament.startDate).toLocaleDateString()}
        </p>
        <p><strong>Status:</strong> {tournament.status}</p>
    </div>
);

export default TournamentCard;
