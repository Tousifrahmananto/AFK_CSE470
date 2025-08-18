import React from "react";

const TournamentCard = ({ tournament }) => {
    const start = tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : "—";
    const end = tournament.endDate ? new Date(tournament.endDate).toLocaleDateString() : "—";
    const deadline = tournament.registrationDeadline
        ? new Date(tournament.registrationDeadline).toLocaleDateString()
        : "—";

    return (
        <div className="card" style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontWeight: "bold" }}>{tournament.title}</h3>
            <p><strong>Game:</strong> {tournament.game}</p>
            <p><strong>Format:</strong> {tournament.bracket}</p>
            {tournament.location && <p><strong>Location:</strong> {tournament.location}</p>}
            <p><strong>Registration Deadline:</strong> {deadline} {tournament.registrationOpen ? "" : "(Closed)"}</p>
            <p><strong>Start:</strong> {start} &nbsp; <strong>End:</strong> {end}</p>
            <p><strong>Status:</strong> {tournament.status}</p>
            {tournament.playerLimit > 0 && (
                <p><strong>Solo:</strong> {tournament.soloCount ?? 0} / {tournament.playerLimit}</p>
            )}
            {tournament.teamLimit > 0 && (
                <p><strong>Teams:</strong> {tournament.teamCount ?? 0} / {tournament.teamLimit}</p>
            )}
        </div>
    );
};

export default TournamentCard;
