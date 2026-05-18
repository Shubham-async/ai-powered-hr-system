import mongoose from 'mongoose';
import Employee from '../models/Employee.js';

const getModel = (name) => { try { return mongoose.model(name); } catch { return null; } };

// GET /api/notifications/:employeeId
export const getNotifications = async (req, res) => {
  try {
    const Notification = getModel("Notification");
    if (!Notification) return res.status(500).json({ message: "Notification model not loaded." });

    const { employeeId } = req.params;
    let recipientObjectId = null;

    // Resolve employeeId string (like EMP001) or treat as ObjectId
    if (mongoose.Types.ObjectId.isValid(employeeId)) {
      recipientObjectId = employeeId;
    } else {
      const emp = await Employee.findOne({ employeeId: employeeId });
      if (!emp) {
        return res.json({ unreadCount: 0, count: 0, data: [], message: "Employee not found." });
      }
      recipientObjectId = emp._id;
    }

    const { read, limit = 30 } = req.query;
    const filter = { recipientId: recipientObjectId };
    if (read !== undefined) filter.read = read === 'true';

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 }).limit(Number(limit)).lean();

    const unreadCount = await Notification.countDocuments({ recipientId: recipientObjectId, read: false });
    res.json({ unreadCount, count: notifications.length, data: notifications });
  } catch (e) { 
    console.error("fetch notifications error:", e);
    res.status(500).json({ message: e.message }); 
  }
};

// PATCH /api/notifications/:notificationId/read
export const markAsRead = async (req, res) => {
  try {
    const Notification = getModel("Notification");
    if (!Notification) return res.status(500).json({ message: "Notification model not loaded." });

    await Notification.findByIdAndUpdate(req.params.notificationId, { read: true, readAt: new Date() });
    res.json({ message: "Notification marked as read." });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// PATCH /api/notifications/:employeeId/read-all
export const markAllAsRead = async (req, res) => {
  try {
    const Notification = getModel("Notification");
    if (!Notification) return res.status(500).json({ message: "Notification model not loaded." });

    const { employeeId } = req.params;
    let recipientObjectId = null;

    if (mongoose.Types.ObjectId.isValid(employeeId)) {
      recipientObjectId = employeeId;
    } else {
      const emp = await Employee.findOne({ employeeId: employeeId });
      if (!emp) return res.status(404).json({ message: "Employee not found." });
      recipientObjectId = emp._id;
    }

    await Notification.updateMany({ recipientId: recipientObjectId, read: false }, { read: true, readAt: new Date() });
    res.json({ message: "All notifications marked as read." });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
