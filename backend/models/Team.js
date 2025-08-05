const mongoose = require("mongoose");
const { Schema } = mongoose;

const teamSchema = new Schema({
    teamName: { type: String, required: true, trim: true },
    captain: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });

module.exports = mongoose.model("Team", teamSchema);
