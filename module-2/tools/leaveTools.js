import mongoose from 'mongoose';
import { ChatGroq } from "@langchain/groq";

const llm = new ChatGroq({
  model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  apiKey: process.env.GROQ_API_KEY,
  temperature: 0.3,
});

// ─── Helper: get models safely ────────────────────────────────────────────────
const getModel = (name) => {
  try { return mongoose.model(name); }
  catch { return null; }
};

// ─── 1. Request Leave (Agent files on behalf of employee) ─────────────────────
export const requestLeave = async (employeeId, leaveType, startDate, endDate, reason, filedVia = "chat") => {
  try {
    const LeaveRequest = getModel("LeaveRequest");
    if (!LeaveRequest) return { status: "error", message: "LeaveRequest model not loaded." };

    const LeaveBalance = getModel("LeaveBalance");

    // Build AI professional note
    const balanceInfo = LeaveBalance
      ? await LeaveBalance.findOne({ employeeId }).lean()
      : null;

    const prompt = `You are Aurion, an AI HR mediator. An employee has requested leave.
Write a concise, professional note (3-5 sentences) for the HR manager reviewing this request.
Details:
- Employee ID: ${employeeId}
- Leave Type: ${leaveType}
- From: ${startDate} To: ${endDate}
- Employee Reason: ${reason}
- Leave Balance: ${balanceInfo ? JSON.stringify(balanceInfo) : 'Not available'}
The note should: summarize the request professionally, mention leave balance if available, and recommend action.`;

    const agentNoteRes = await llm.invoke(prompt);
    const agentNote = agentNoteRes?.content || `${leaveType} leave requested by Employee ${employeeId} from ${startDate} to ${endDate}. Reason: ${reason}.`;

    const leave = new LeaveRequest({
      employeeId,
      leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      employeeNote: reason,
      agentNote,
      mediatedBy: "agent",
      filedVia,
      status: "Pending"
    });

    await leave.save();

    return {
      status: "success",
      message: `Your ${leaveType} leave from ${startDate} to ${endDate} has been filed. HR has been notified.`,
      leaveId: leave._id,
      agentNote
    };
  } catch (e) {
    return { status: "error", message: e.message };
  }
};

// ─── 2. Get leave status for an employee ──────────────────────────────────────
export const getLeaveStatus = async (employeeId) => {
  try {
    const LeaveRequest = getModel("LeaveRequest");
    if (!LeaveRequest) return { status: "error", message: "Model not loaded." };

    const leaves = await LeaveRequest.find({ employeeId })
      .sort({ createdAt: -1 }).limit(10).lean();

    const summary = {
      total: leaves.length,
      pending: leaves.filter(l => l.status === "Pending").length,
      approved: leaves.filter(l => l.status === "Approved").length,
      rejected: leaves.filter(l => l.status === "Rejected").length,
      recent: leaves.slice(0, 5)
    };

    return { status: "success", data: summary };
  } catch (e) {
    return { status: "error", message: e.message };
  }
};

// ─── 3. HR approves or rejects a leave (intent-only for agent confirmation) ───
export const hrRespondToLeave = async (leaveId, decision, hrEmployeeId, comment = "") => {
  try {
    const LeaveRequest = getModel("LeaveRequest");
    if (!LeaveRequest) return { status: "error", message: "Model not loaded." };

    const leave = await LeaveRequest.findById(leaveId);
    if (!leave) return { status: "error", message: `Leave request ${leaveId} not found.` };

    leave.status = decision; // "Approved" | "Rejected"
    leave.approvedBy = hrEmployeeId;
    leave.hrComment = comment;
    await leave.save();

    // Create a notification for the employee
    const Notification = getModel("Notification");
    if (Notification) {
      await Notification.create({
        recipientId: leave.employeeId,
        type: decision === "Approved" ? "leave_approved" : "leave_rejected",
        title: `Leave Request ${decision}`,
        message: `Your ${leave.leaveType} leave from ${leave.startDate.toDateString()} to ${leave.endDate.toDateString()} has been ${decision.toLowerCase()}. ${comment ? `HR Note: ${comment}` : ""}`,
        refModel: "LeaveRequest",
        refId: leave._id,
        priority: "high"
      });
    }

    return {
      status: "success",
      message: `Leave ${decision.toLowerCase()} successfully. Employee has been notified.`,
      leaveId
    };
  } catch (e) {
    return { status: "error", message: e.message };
  }
};

// ─── 4. Get leave balance for an employee ─────────────────────────────────────
export const getLeaveBalance = async (employeeId) => {
  try {
    const LeaveBalance = getModel("LeaveBalance");
    if (!LeaveBalance) return { status: "error", message: "LeaveBalance model not loaded." };

    const balance = await LeaveBalance.findOne({ employeeId }).lean();
    if (!balance) return { status: "error", message: `No balance record found for ${employeeId}.` };

    return { status: "success", data: balance };
  } catch (e) {
    return { status: "error", message: e.message };
  }
};

// ─── 5. Get all pending leaves (HR overview) ──────────────────────────────────
export const getPendingLeaves = async () => {
  try {
    const LeaveRequest = getModel("LeaveRequest");
    if (!LeaveRequest) return { status: "error", message: "Model not loaded." };

    const leaves = await LeaveRequest.find({ status: "Pending" })
      .sort({ createdAt: 1 }).lean();

    return { status: "success", count: leaves.length, data: leaves };
  } catch (e) {
    return { status: "error", message: e.message };
  }
};

// ─── 6. Generate leave recommendation for an employee ─────────────────────────
export const generateLeaveRecommendation = async (employeeId) => {
  try {
    const LeaveRequest = getModel("LeaveRequest");
    const LeaveBalance = getModel("LeaveBalance");

    const leaves = LeaveRequest ? await LeaveRequest.find({ employeeId }).lean() : [];
    const balance = LeaveBalance ? await LeaveBalance.findOne({ employeeId }).lean() : null;

    const prompt = `Analyze this employee's leave history and balance, then give a 2-3 sentence actionable recommendation.
Leave History: ${JSON.stringify(leaves.slice(0, 10))}
Balance: ${JSON.stringify(balance)}
Be practical — mention if they should plan leaves, if their balance is low, or if there are patterns.`;

    const res = await llm.invoke(prompt);
    return { status: "success", recommendation: res?.content };
  } catch (e) {
    return { status: "error", message: e.message };
  }
};
