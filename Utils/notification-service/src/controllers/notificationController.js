import NotificationQueue from "../queues/notificationQueue.js";

export const sendNotificationController = async (req, res) => {
  try {
    const { to, subject, html } = req.body;

    if (!to || !subject || !html)
      return res.status(400).json({ success: false, message: "Missing fields" });

    // Add to queue
    await NotificationQueue.add({ to, subject, html });

    res.status(200).json({
      success: true,
      message: "Notification job added to queue",
    });
  } catch (error) {
    console.error("❌ Notification Controller Error:", error);
    res.status(500).json({ success: false, message: "Notification failed" });
  }
};
