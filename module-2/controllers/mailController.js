import mongoose from 'mongoose';
import * as mailToolsObj from '../tools/mailTools.js';

const getModel = (name) => { try { return mongoose.model(name); } catch { return null; } };

// POST /api/mail/send
export const sendMail = async (req, res) => {
  try {
    const { to, subject, body, toEmployeeId, relatedModule, isHtml } = req.body;
    if (!to || !subject || !body) return res.status(400).json({ message: "to, subject, body are required." });
    const result = await mailToolsObj.sendMail({ to, subject, body, toEmployeeId, isHtml, relatedModule, triggeredBy: "manual" });
    res.status(201).json(result);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// GET /api/mail/employee/:employeeId
export const getEmployeeMail = async (req, res) => {
  try {
    const result = await mailToolsObj.getMailLog(req.params.employeeId, req.query.limit || 20);
    res.json(result);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// GET /api/mail/all
export const getAllMail = async (req, res) => {
  try {
    const MailLog = getModel("MailLog");
    if (!MailLog) return res.status(500).json({ message: "MailLog model not loaded." });
    const { module: mod, status, limit = 30, page = 1 } = req.query;
    const filter = {};
    if (mod) filter.relatedModule = mod;
    if (status) filter.status = status;
    const mails = await MailLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)).lean();
    const total = await MailLog.countDocuments(filter);
    res.json({ total, page: Number(page), data: mails });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
