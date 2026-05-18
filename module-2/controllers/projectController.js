import * as projectToolsObj from '../tools/projectTools.js';
import mongoose from 'mongoose';

const getModel = (name) => { try { return mongoose.model(name); } catch { return null; } };

// POST /api/projects
export const createProject = async (req, res) => {
  try {
    const { name, description, leadId, departmentId, startDate, endDate, priority } = req.body;
    if (!name) return res.status(400).json({ message: "Project name is required." });
    const result = await projectToolsObj.createProject(name, description, leadId, departmentId, startDate, endDate, priority);
    res.status(201).json(result);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// GET /api/projects
export const getAllProjects = async (req, res) => {
  try {
    const Project = getModel("Project");
    if (!Project) return res.status(500).json({ message: "Model not loaded." });
    const { status, priority } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    const projects = await Project.find(filter)
      .populate("projectLeadId", "firstName lastName email")
      .populate("members.employeeId", "firstName lastName email")
      .sort({ createdAt: -1 }).lean();
    res.json({ count: projects.length, data: projects });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// GET /api/projects/:id
export const getProject = async (req, res) => {
  try {
    const result = await projectToolsObj.getProjectStatus(req.params.id);
    res.json(result);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// POST /api/projects/:id/members
export const addMember = async (req, res) => {
  try {
    const { employeeId, role } = req.body;
    if (!employeeId) return res.status(400).json({ message: "employeeId is required." });
    const result = await projectToolsObj.addMemberToProject(req.params.id, employeeId, role);
    if (req.io) req.io.notifyEmployee(employeeId, "project-update", { type: "member_added", projectId: req.params.id });
    res.json(result);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// POST /api/projects/:id/milestones
export const addMilestone = async (req, res) => {
  try {
    const { title, description, deadline } = req.body;
    if (!title) return res.status(400).json({ message: "Milestone title is required." });
    const result = await projectToolsObj.addMilestone(req.params.id, title, description, deadline);
    res.status(201).json(result);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// PATCH /api/projects/:id/milestones/:milestoneId
export const updateMilestone = async (req, res) => {
  try {
    const { status } = req.body;
    const result = await projectToolsObj.updateMilestoneStatus(req.params.id, req.params.milestoneId, status);
    if (req.io) req.io.notifyHR("project-update", { type: "milestone_updated", projectId: req.params.id, milestoneId: req.params.milestoneId, status });
    res.json(result);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// POST /api/projects/:id/feedback
export const submitFeedback = async (req, res) => {
  try {
    const { employeeId, message, submittedVia } = req.body;
    if (!employeeId || !message) return res.status(400).json({ message: "employeeId and message are required." });
    const result = await projectToolsObj.submitProjectFeedback(req.params.id, employeeId, message, submittedVia);
    res.json(result);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// GET /api/projects/:id/health-summary
export const getHealthSummary = async (req, res) => {
  try {
    const result = await projectToolsObj.generateProjectHealthSummary(req.params.id);
    res.json(result);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// PATCH /api/projects/:id
export const updateProject = async (req, res) => {
  try {
    const Project = getModel("Project");
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!project) return res.status(404).json({ message: "Project not found." });
    res.json({ success: true, data: project });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// DELETE /api/projects/:id
export const deleteProject = async (req, res) => {
  try {
    const Project = getModel("Project");
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found." });
    res.json({ success: true, message: "Project deleted successfully." });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const getEmployeeProjects = async (req, res) => {
  try {
    const result = await projectToolsObj.getProjectsForEmployee(req.params.employeeId);
    res.json(result);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
