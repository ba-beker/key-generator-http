const mongoose = require("mongoose");

const contractSchema = new mongoose.Schema({
  deviceId: { type: String, unique: true },
  soldToken: { type: String, required: true, unique: true },
  // id: { type: String, required: true, unique: true },
  startDate: Date,
  expiringDate: Date,
  deleted: { type: Boolean, default: false },
  deletionDate: Date,
});

module.exports = mongoose.model("Contract", contractSchema);
