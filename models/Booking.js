const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
  id:        { type: String, required: true, unique: true },
  userEmail: { type: String, required: true, lowercase: true },
  trainId:   { type: String, required: true },
  trainName: String,
  from:      String,
  to:        String,
  date:      String,
  dep:       String,
  arr:       String,
  car:       Number,
  seat:      String,
  class:     String,
  type:      String,
  price:     Number,
  status:    { type: String, enum: ["confirmed", "cancelled", "completed"], default: "confirmed" },
  passenger: String,
}, { timestamps: true });

module.exports = mongoose.model("Booking", BookingSchema);
