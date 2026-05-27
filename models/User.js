const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  name:     { type: String, required: true },
  role:     { type: String, enum: ["traveler", "manager"], default: "traveler" },
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
