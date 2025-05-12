const mongoose = require("mongoose");

const AuthTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    expired: { type: Boolean, default: false },
    generatingDate: { type: Date, required: true },
    expiringDate: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuthToken", AuthTokenSchema);
