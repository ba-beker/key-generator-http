const mongoose = require("mongoose");

const archivedUserSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  userId: String,
  firstName: String,
  lastName: String,
  birthDate: Date,
  placeOfBirth: String,
  email: String,
  phone: String,
  school: String,
  address: String,
  userType: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  archivedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ArchivedUser", archivedUserSchema);
