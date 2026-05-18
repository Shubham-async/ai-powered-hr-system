import mongoose from 'mongoose';
import { ChatGroq } from "@langchain/groq";

const llm = new ChatGroq({
  model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  apiKey: process.env.GROQ_API_KEY,
  temperature: 0.3,
});

const getModel = (name) => {
  try { return mongoose.model(name); } catch { return null; }
};

// ─── 1. Create a new project ──────────────────────────────────────────────────
export const createProject = async (name, description, leadId, departmentId, startDate, endDate, priority = "Medium") => {
  try {
    const Project = getModel("Project");
    if (!Project) return { status: "error", message: "Project model not loaded." };

    const project = new Project({
      name, description,
      projectLeadId: leadId || null,
      departmentId: departmentId || null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      priority,
      status: "Active"
    });

    await project.save();
    return { status: "success", message: `Project "${name}" created successfully.`, projectId: project._id };
  } catch (e) {
    return { status: "error", message: e.message };
  }
};

// ─── 2. Add a member to a project ─────────────────────────────────────────────
export const addMemberToProject = async (projectId, employeeId, role = "Member") => {
  try {
    const Project = getModel("Project");
    if (!Project) return { status: "error", message: "Project model not loaded." };

    const project = await Project.findById(projectId);
    if (!project) return { status: "error", message: `Project ${projectId} not found.` };

    const alreadyMember = project.members.some(m => m.employeeId.toString() === employeeId.toString());
    if (alreadyMember) return { status: "warning", message: "Employee is already a member." };

    project.members.push({ employeeId, role, joinedAt: new Date() });
    await project.save();

    // Notify employee
    const Notification = getModel("Notification");
    if (Notification) {
      await Notification.create({
        recipientId: employeeId,
        type: "project_assigned",
        title: "You've been added to a project",
        message: `You have been added to project "${project.name}" as a ${role}.`,
        refModel: "Project", refId: project._id
      });
    }

    return { status: "success", message: `Employee added to "${project.name}" as ${role}.` };
  } catch (e) {
    return { status: "error", message: e.message };
  }
};

// ─── 3. Add a milestone to a project ──────────────────────────────────────────
export const addMilestone = async (projectId, title, description, deadline) => {
  try {
    const Project = getModel("Project");
    if (!Project) return { status: "error", message: "Project model not loaded." };

    const project = await Project.findById(projectId);
    if (!project) return { status: "error", message: `Project ${projectId} not found.` };

    project.milestones.push({
      title, description,
      deadline: deadline ? new Date(deadline) : null,
      status: "Not Started"
    });

    await project.save();
    return { status: "success", message: `Milestone "${title}" added to project.`, milestoneId: project.milestones[project.milestones.length - 1]._id };
  } catch (e) {
    return { status: "error", message: e.message };
  }
};

// ─── 4. Update milestone status ───────────────────────────────────────────────
export const updateMilestoneStatus = async (projectId, milestoneId, status) => {
  try {
    const Project = getModel("Project");
    if (!Project) return { status: "error", message: "Project model not loaded." };

    const project = await Project.findById(projectId);
    if (!project) return { status: "error", message: "Project not found." };

    const milestone = project.milestones.id(milestoneId);
    if (!milestone) return { status: "error", message: "Milestone not found." };

    milestone.status = status;
    if (status === "Completed") milestone.completedAt = new Date();
    
    project.recomputeCompletion();
    await project.save();

    return { status: "success", message: `Milestone "${milestone.title}" updated to ${status}. Project is ${project.completionPercent}% complete.` };
  } catch (e) {
    return { status: "error", message: e.message };
  }
};

// ─── 5. Submit employee feedback on a project (with AI sentiment) ─────────────
export const submitProjectFeedback = async (projectId, employeeId, message, submittedVia = "chat") => {
  try {
    const Project = getModel("Project");
    if (!Project) return { status: "error", message: "Project model not loaded." };

    const project = await Project.findById(projectId);
    if (!project) return { status: "error", message: "Project not found." };

    // Run sentiment analysis
    const sentimentPrompt = `Analyze the sentiment of this employee project feedback. Reply with ONLY a JSON object like:
{"sentiment":"Positive","score":0.8,"summary":"Brief summary"}
Feedback: "${message}"`;

    let sentiment = "Unknown";
    let sentimentScore = 0;

    try {
      const sentRes = await llm.invoke(sentimentPrompt);
      const parsed = JSON.parse(sentRes.content.replace(/```json|```/g, '').trim());
      sentiment = parsed.sentiment || "Unknown";
      sentimentScore = parsed.score || 0;
    } catch {}

    project.feedbackLog.push({ employeeId, message, sentiment, sentimentScore, submittedVia });

    // Recompute health score as average of all sentiment scores (scaled to 0-100)
    if (project.feedbackLog.length > 0) {
      const avg = project.feedbackLog.reduce((sum, f) => sum + (f.sentimentScore || 0), 0) / project.feedbackLog.length;
      project.healthScore = Math.round((avg + 1) / 2 * 100); // map -1..1 to 0..100
      project.lastHealthUpdate = new Date();
    }

    await project.save();

    return {
      status: "success",
      message: `Feedback recorded. Sentiment: ${sentiment}. Project health score: ${project.healthScore}/100.`,
      sentiment, sentimentScore
    };
  } catch (e) {
    return { status: "error", message: e.message };
  }
};

// ─── 6. Get full project status ───────────────────────────────────────────────
export const getProjectStatus = async (projectId) => {
  try {
    const Project = getModel("Project");
    if (!Project) return { status: "error", message: "Project model not loaded." };

    const project = await Project.findById(projectId)
      .populate("members.employeeId", "name email department")
      .populate("projectLeadId", "name email")
      .lean();

    if (!project) return { status: "error", message: "Project not found." };

    const milestoneStats = {
      total: project.milestones.length,
      completed: project.milestones.filter(m => m.status === "Completed").length,
      delayed: project.milestones.filter(m => m.status === "Delayed").length,
      inProgress: project.milestones.filter(m => m.status === "In Progress").length,
    };

    const sentimentBreakdown = {
      positive: project.feedbackLog.filter(f => f.sentiment === "Positive").length,
      neutral: project.feedbackLog.filter(f => f.sentiment === "Neutral").length,
      negative: project.feedbackLog.filter(f => f.sentiment === "Negative").length,
    };

    return {
      status: "success",
      data: { ...project, milestoneStats, sentimentBreakdown }
    };
  } catch (e) {
    return { status: "error", message: e.message };
  }
};

// ─── 7. Get all projects for an employee ──────────────────────────────────────
export const getProjectsForEmployee = async (employeeId) => {
  try {
    const Project = getModel("Project");
    if (!Project) return { status: "error", message: "Project model not loaded." };

    const projects = await Project.find({
      $or: [
        { "members.employeeId": employeeId },
        { projectLeadId: employeeId }
      ]
    }).select("name status priority completionPercent healthScore endDate").lean();

    return { status: "success", count: projects.length, data: projects };
  } catch (e) {
    return { status: "error", message: e.message };
  }
};

// ─── 8. AI Project Health Summary ────────────────────────────────────────────
export const generateProjectHealthSummary = async (projectId) => {
  try {
    const result = await getProjectStatus(projectId);
    if (result.status !== "success") return result;

    const p = result.data;
    const prompt = `You are an AI project analyst. Summarize the health of this project in 4-5 sentences for an HR manager.
Project: ${p.name}
Status: ${p.status} | Priority: ${p.priority} | Completion: ${p.completionPercent}%
Health Score: ${p.healthScore}/100
Milestones: ${JSON.stringify(p.milestoneStats)}
Feedback Sentiment: ${JSON.stringify(p.sentimentBreakdown)}
Team size: ${p.members?.length || 0}
Deadline: ${p.endDate}
Be direct, mention risks, and highlight any concerns.`;

    const res = await llm.invoke(prompt);
    return { status: "success", summary: res?.content, projectName: p.name, healthScore: p.healthScore };
  } catch (e) {
    return { status: "error", message: e.message };
  }
};
// ─── 9. Submit a project progress update ─────────────────────────────────────────
export const submitProjectUpdate = async (projectId, employeeId, updateText, progressDelta = 0) => {
  try {
    const Project = getModel("Project");
    if (!Project) return { status: "error", message: "Project model not loaded." };

    const project = await Project.findById(projectId);
    if (!project) return { status: "error", message: "Project not found." };

    // AI Summary of the update
    const summaryPrompt = `Summarize this project update into one concise sentence for a manager: "${updateText}"`;
    let aiSummary = updateText;
    try {
      const summaryRes = await llm.invoke(summaryPrompt);
      aiSummary = summaryRes.content.trim();
    } catch {}

    project.statusUpdates.push({
      employeeId,
      updateText,
      progressDelta,
      aiSummary,
      timestamp: new Date()
    });

    if (progressDelta > 0) {
      project.completionPercent = Math.min(100, project.completionPercent + Number(progressDelta));
    }

    await project.save();

    return {
      status: "success",
      message: `Project update recorded successfully. AI Summary: ${aiSummary}`,
      newCompletion: project.completionPercent
    };
  } catch (e) {
    return { status: "error", message: e.message };
  }
};
