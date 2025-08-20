const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Notification", notificationSchema);
