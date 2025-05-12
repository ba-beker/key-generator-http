const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
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
}, {
  toJSON: {
    transform: function(doc, ret) {
      delete ret._id;   // Remove _id
      delete ret.__v;   // Remove version key (__v)
    }
  }
});

module.exports = mongoose.model("User", userSchema);
