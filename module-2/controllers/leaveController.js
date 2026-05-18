import mongoose from 'mongoose';
import * as leaveToolsObj from '../tools/leaveTools.js';

const getModel = (name) => {
  try { return mongoose.model(name); } catch { return null; }
};

// POST /api/leave/request — Employee files leave
export const requestLeave = async (req, res) => {
  try {
    const { employeeId, leaveType, startDate, endDate, reason } = req.body;
    if (!employeeId || !leaveType || !startDate || !endDate)
      return res.status(400).json({ message: "employeeId, leaveType, startDate, endDate are required." });

    const result = await leaveToolsObj.requestLeave(employeeId, leaveType, startDate, endDate, reason || "", "manual_form");

    // Notify HR room via socket if io is available
    if (req.io) req.io.notifyHR("leave-request", { ...result, employeeId, leaveType });

    res.status(201).json(result);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// GET /api/leave/status/:employeeId
export const getLeaveStatus = async (req, res) => {
  try {
    const result = await leaveToolsObj.getLeaveStatus(req.params.employeeId);
    res.json(result);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// GET /api/leave/balance/:employeeId
export const getLeaveBalance = async (req, res) => {
  try {
    const result = await leaveToolsObj.getLeaveBalance(req.params.employeeId);
    res.json(result);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// GET /api/leave/pending — HR only
export const getPendingLeaves = async (req, res) => {
  try {
    const result = await leaveToolsObj.getPendingLeaves();
    res.json(result);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// PATCH /api/leave/:leaveId/respond — HR approves or rejects
export const respondToLeave = async (req, res) => {
  try {
    const { decision, hrEmployeeId, comment } = req.body;
    const { leaveId } = req.params;

    if (!decision || !hrEmployeeId)
      return res.status(400).json({ message: "decision and hrEmployeeId are required." });

    const result = await leaveToolsObj.hrRespondToLeave(leaveId, decision, hrEmployeeId, comment || "");

    // Notify employee in real-time
    if (req.io && result.employeeId) {
      req.io.notifyEmployee(result.employeeId?.toString(), "leave-update", {
        leaveId, decision, comment
      });
    }

    res.json(result);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// GET /api/leave/all — All leaves (paginated)
export const getAllLeaves = async (req, res) => {
  try {
    const LeaveRequest = getModel("LeaveRequest");
    if (!LeaveRequest) return res.status(500).json({ message: "Model not loaded." });

    const { page = 1, limit = 20, status, employeeId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (employeeId) filter.employeeId = employeeId;

    const leaves = await LeaveRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('employeeId')
      .lean();

    const total = await LeaveRequest.countDocuments(filter);
    res.json({ total, page: Number(page), data: leaves });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
