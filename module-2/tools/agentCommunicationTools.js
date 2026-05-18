import mongoose from 'mongoose';

const getModel = (name) => {
  try { return mongoose.model(name); } catch { return null; }
};

/**
 * Tool for an employee to pass a message to HR via the AI Agent.
 * @param {string} fromEmployeeId - The ID of the employee sending the message.
 * @param {string} message - The content of the alert or information.
 */
export const informHR = async (fromEmployeeId, message) => {
  try {
    const Notification = getModel("Notification");
    const User = getModel("User");
    if (!Notification || !User) return { status: "error", message: "Models not loaded." };

    // Find all HR/Admin users to notify
    const hrUsers = await User.find({ role: { $in: ['hr', 'admin'] } });
    
    for (const hr of hrUsers) {
      await Notification.create({
        recipientId: hr._id,
        type: "hr_alert",
        title: "New Employee Message via AI Agent",
        message: `Employee (${fromEmployeeId}) says: "${message}"`,
        refModel: "User",
        refId: fromEmployeeId
      });
    }

    return { 
      status: "success", 
      message: "The HR team has been notified of your message. I will update them as soon as they log in." 
    };
  } catch (err) {
    return { status: "error", message: err.message };
  }
};

/**
 * Tool for HR to check messages left for them by the AI Agent.
 * @param {string} hrId - The ID of the HR person checking messages.
 */
export const getHRAgentUpdates = async (hrId) => {
  try {
    const Notification = getModel("Notification");
    if (!Notification) return { status: "error", message: "Notification model not loaded." };

    const updates = await Notification.find({ 
      recipientId: hrId, 
      type: "hr_alert",
      read: false 
    }).sort({ createdAt: -1 }).limit(5);

    if (updates.length === 0) {
      return { status: "success", message: "No new employee messages or alerts for you." };
    }

    const messages = updates.map(u => u.message).join('\n---\n');
    return { 
      status: "success", 
      message: `You have ${updates.length} new employee alerts recorded by me:\n\n${messages}` 
    };
  } catch (err) {
    return { status: "error", message: err.message };
  }
};
