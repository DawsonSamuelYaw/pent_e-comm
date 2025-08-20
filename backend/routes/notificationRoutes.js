const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");

// ✅ Get all notifications
router.get("/", async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    console.error("❌ Error fetching notifications:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Mark as read
router.put("/:id/read", async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    res.json(notification);
  } catch (error) {
    console.error("❌ Error updating notification:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Delete
router.delete("/:id", async (req, res) => {
  try {
    const deletedNotification = await Notification.findByIdAndDelete(req.params.id);
    if (!deletedNotification) return res.status(404).json({ message: "Notification not found" });
    res.json({ message: "Notification deleted" });
  } catch (error) {
    console.error("❌ Error deleting notification:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
