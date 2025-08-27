// backend/models/Notification.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, default: "general" },        // e.g. team, tournament, general
    title: { type: String, default: "" },
    message: { type: String, default: "" },
    actor: { type: Schema.Types.ObjectId, ref: "User" },   // who triggered it
    teamId: { type: Schema.Types.ObjectId, ref: "Team" },
    tournamentId: { type: Schema.Types.ObjectId, ref: "Tournament" },
    read: { type: Boolean, default: false },
    readAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
