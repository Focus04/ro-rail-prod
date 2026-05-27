const mongoose = require("mongoose");

const TrainSchema = new mongoose.Schema({
  id:       { type: String, required: true, unique: true },
  type:     { type: String, required: true },
  from:     { type: String, required: true },
  to:       { type: String, required: true },
  dep:      { type: String, required: true },
  arr:      { type: String, required: true },
  duration: { type: String, required: true },
  price:    { type: Number, required: true },
  cars:     { type: Number, required: true },
  name:     { type: String, default: null },
  stops:    [String],
}, { timestamps: true });

module.exports = mongoose.model("Train", TrainSchema);
