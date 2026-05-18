import { ChatGroq } from "@langchain/groq";
import { StateGraph, MemorySaver, Annotation } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import * as universalDbTools from "../tools/universalDbTools.js";
import * as hiringToolsObj from "../tools/hiringTools.js";
import * as leaveToolsObj from "../tools/leaveTools.js";
import * as projectToolsObj from "../tools/projectTools.js";
import * as mailToolsObj from "../tools/mailTools.js";
import * as analyticsToolsObj from "../tools/analyticsTools.js";
import * as onboardingToolsObj from "../tools/onboardingTools.js";
import * as commToolsObj from "../tools/agentCommunicationTools.js";
import * as assessmentToolsObj from "../tools/assessmentTools.js";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";

// ═══════════════════════════════════════════════════════════════════════════════
//  GRAPH STATE
// ═══════════════════════════════════════════════════════════════════════════════
export const GraphState = Annotation.Root({
  messages: Annotation({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  pending_action: Annotation({
    reducer: (x, y) => y === null ? null : { ...x, ...y },
    default: () => null,
  }),
  employeeId: Annotation({
    reducer: (x, y) => y,
    default: () => "EMP001",
  }),
  employeeName: Annotation({
    reducer: (x, y) => y,
    default: () => "Sir/Ma'am",
  }),
  employeeRole: Annotation({
    reducer: (x, y) => y,
    default: () => "employee",
  }),
  employeeContext: Annotation({
    reducer: (x, y) => y === null ? null : { ...x, ...y },
    default: () => ({}),
  }),
  contextModule: Annotation({
    reducer: (x, y) => y,
    default: () => "general",
  }),
});

// ═══════════════════════════════════════════════════════════════════════════════
//  ROLE-AWARE SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════════════════════════
const buildSystemPrompt = (role = "employee", empId = "EMP001", empName = "Sir/Ma'am", context = {}) => `
You are Aurion — a respectful, efficient, and professional Executive AI HR Assistant.
You are speaking with ${empName} (Employee ID: ${empId}) who has role: ${role.toUpperCase()}.
USER CONTEXT:
${Object.entries(context).length > 0 ? JSON.stringify(context, null, 2) : "No detailed context available."}

### PERSONA & TONE:
- Address the user as "Sir" or "Ma'am" frequently, or use their name (${empName}) if it's natural.
- Be extremely polite, helpful, and proactive. Use phrases like "Certainly, Sir," "Of course, Ma'am," or "I've handled that for you, ${empName}."
- Your goal is to make the HR professional's life easier by handling the administrative heavy lifting.

CAPABILITIES:
1. HIRING: Generate JDs, post jobs, shortlist candidates, schedule interviews, send offer letters, create onboarding plans.
2. LEAVE MANAGEMENT: File leave requests on behalf of employees (you write the professional note for HR). Approve/reject as HR. Show balances.
3. PROJECT MANAGEMENT: Create projects, add members, set milestones, track deadlines, analyze employee feedback (with sentiment), generate health reports.
4. ANALYTICS: Show charts and KPI dashboards — hiring funnel, leave heatmap, project health, headcount, onboarding rates. Always call generateGraphData after an analytics fetch.
5. COMMUNICATION: Compose and log professional mails (interview invites, onboarding welcome, leave notifications).
6. DATABASE: Query and modify any HR record using the universal DB tools.

ROLE-SPECIFIC BEHAVIOR:
${role === "employee" ? `
- You are the EMPLOYEE'S advocate. Help them file leaves, check their status, view their projects.
- When filing leave: always draft a professional agent note before submitting. Show the draft to the employee and confirm before filing.
- Do NOT execute HR-only actions (approving leaves, viewing all employees, etc.).
` : role === "hr" ? `
- You are the HR EXECUTIVE ASSISTANT. You have full access to employees, leaves, projects, analytics.
- Handle leave approvals, project management, hiring pipeline, analytics reporting.
- Always use CONFIRMATION_REQUIRED intent for approvals/rejections/deletions.
` : `
- ADMIN role: Full unrestricted access to all systems and all operations.
`}

CRITICAL RULES:
- Respond in a CONVERSATIONAL, SPEAKING STYLE optimized for Text-to-Speech (TTS). 
- Use natural pauses and clear, rhythmic sentences. DO NOT use raw data tables, technical JSON, or complex Markdown in the final spoken response.
- NEVER execute destructive DB operations (update/delete) directly — always use intent tools that require confirmation.
- When generating analytics data, ALWAYS follow up immediately with a generateGraphData tool call to visualize it.
- When sending email to a group or to everyone, NEVER use a generic alias such as all@company, everyone@company, or any distribution list placeholder. Instead, send actual emails to each recipient's real address, one by one or via a recipient list of real email addresses.
- If you need employee or candidate email addresses for a broadcast, use the available database query tool to fetch the target list rather than inventing a generic alias.
- When a tool records a "special intent" (like a confirmation or a graph), the tool will return a success message to you. You MUST then provide a polite natural language acknowledgement to the user (e.g., "I've prepared that leave approval for you, Sir. Would you like to confirm it now?") instead of a blank response.
- Use tools automatically to fetch data, but do not narrate the technical process. Simply give the result naturally.
- If "INIT_WELCOME_FLOW" is in the message, greet the user warmly and summarize pending items for them. DO NOT call any tools.
`.trim();

// ═══════════════════════════════════════════════════════════════════════════════
//  TOOL DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Universal DB Tools ───────────────────────────────────────────────────────
const databaseQueryTool = tool(
  async ({ modelName, filterStr, limit }) =>
    await universalDbTools.databaseQuery(modelName, filterStr || "{}", limit ?? 20),
  {
    name: "databaseQuery",
    description: "Query any mongoose model. Model names: Employee, JobDescription, Candidate, CandidateApplied, LeaveRequest, Project, Notification, MailLog.",
    schema: z.object({
      modelName: z.string(),
      filterStr: z.string().optional().describe("JSON filter string e.g. '{\"status\":\"Pending\"}'"),
      limit: z.number().nullable().optional()
    }),
  }
);

const databaseAggregationTool = tool(
  async ({ modelName, pipelineStr }) =>
    await universalDbTools.databaseAggregation(modelName, pipelineStr),
  {
    name: "databaseAggregation",
    description: "Run a Mongoose aggregation pipeline (JSON string) against any model.",
    schema: z.object({
      modelName: z.string(),
      pipelineStr: z.string().describe("JSON string of the aggregation pipeline array")
    }),
  }
);

const listModelsTool = tool(
  async () => JSON.stringify(universalDbTools.listAvailableModels()),
  {
    name: "listModels",
    description: "List all loaded Mongoose models.",
    schema: z.object({}),
  }
);

const updateDatabaseIntentTool = tool(
  async ({ modelName, id, updateData }) => JSON.stringify({
    __special_intent: "CONFIRMATION_REQUIRED",
    action: "executeUniversalUpdate",
    parameters: { modelName, id, updateData }
  }),
  {
    name: "prepareUpdateDatabase",
    description: "Prepare a DB update — requires user confirmation before execution.",
    schema: z.object({
      modelName: z.string(),
      id: z.string(),
      updateData: z.string().describe("JSON string of key-value pairs to update")
    }),
  }
);

const deleteDatabaseIntentTool = tool(
  async ({ modelName, id }) => JSON.stringify({
    __special_intent: "CONFIRMATION_REQUIRED",
    action: "executeUniversalDelete",
    parameters: { modelName, id }
  }),
  {
    name: "prepareDeleteDatabase",
    description: "Prepare a DB delete — requires user confirmation before execution.",
    schema: z.object({ modelName: z.string(), id: z.string() }),
  }
);

// ─── Graph / Visualization ────────────────────────────────────────────────────
const generateGraphDataTool = tool(
  async ({ title, type, dataKeys, dataItems }) => {
    const parsedData = typeof dataItems === 'string' ? JSON.parse(dataItems) : dataItems;
    return JSON.stringify({
      __special_intent: "RENDER_GRAPH",
      graphPayload: { title, type, dataKeys, dataItems: parsedData }
    });
  },
  {
    name: "generateGraphData",
    description: "Send chart data to the UI. Call this IMMEDIATELY after any analytics fetch. type can be: bar, line, pie.",
    schema: z.object({
      title: z.string(),
      type: z.enum(["bar", "line", "pie"]),
      dataKeys: z.array(z.string()),
      dataItems: z.any()
    }),
  }
);

// ─── Hiring Tools ─────────────────────────────────────────────────────────────
const generateJDTool = tool(
  async ({ role, requirements, experienceLevel }) =>
    JSON.stringify(await hiringToolsObj.generateJobDescription(role, requirements, experienceLevel)),
  {
    name: "generateJobDescription",
    description: "Generate a Job Description for a role.",
    schema: z.object({ role: z.string(), requirements: z.string(), experienceLevel: z.string() }),
  }
);

const shortlistCandidatesTool = tool(
  async ({ jobId, topN }) =>
    JSON.stringify(await hiringToolsObj.shortlistCandidates(jobId, topN)),
  {
    name: "shortlistCandidates",
    description: "Shortlist top N candidates for a specific job.",
    schema: z.object({ jobId: z.string(), topN: z.number() }),
  }
);

const scheduleInterviewsTool = tool(
  async ({ candidateId, jobId, dateStr, round, mode, interviewerIds }) =>
    JSON.stringify(await hiringToolsObj.scheduleInterviews(candidateId, jobId, dateStr, round, mode, interviewerIds)),
  {
    name: "scheduleInterviews",
    description: "Schedule an interview for a candidate, assigning one or more interviewer IDs.",
    schema: z.object({ 
      candidateId: z.string(), 
      jobId: z.string(), 
      dateStr: z.string(), 
      round: z.enum(["technical", "hr", "managerial", "final"]).optional(), 
      mode: z.enum(["online", "onsite"]).optional(), 
      interviewerIds: z.array(z.string()).optional() 
    }),
  }
);

const postToPlatformTool = tool(
  async ({ platformName, role, requirements, experienceLevel }) =>
    JSON.stringify(await hiringToolsObj.postToPlatform(platformName, { role, requirements, experienceLevel })),
  {
    name: "postJobToPlatform",
    description: "Post a job to an external platform (DemoPortal, LinkedIn, etc.).",
    schema: z.object({ platformName: z.string(), role: z.string(), requirements: z.string(), experienceLevel: z.string() }),
  }
);

const getCandidatesTool = tool(
  async ({ jobId }) => JSON.stringify(await hiringToolsObj.getCandidates(jobId)),
  {
    name: "getCandidates",
    description: "Get all candidates (name, email, skills) who have applied for a specific job (or all candidates if jobId is null).",
    schema: z.object({ jobId: z.string().optional().nullable() }),
  }
);

const getShortlistedCandidatesTool = tool(
  async ({ jobId }) => JSON.stringify(await hiringToolsObj.getShortlistedCandidates(jobId)),
  {
    name: "getShortlistedCandidates",
    description: "Get the AI-shortlisted candidates for a specific job.",
    schema: z.object({ jobId: z.string().optional().nullable() }),
  }
);

const finalizeCandidateDecisionTool = tool(
  async ({ candidateId, jobId, decision, baseSalary, positionTitle }) => JSON.stringify(await hiringToolsObj.finalizeCandidateDecision(candidateId, jobId, decision, baseSalary, positionTitle)),
  {
    name: "finalizeCandidateDecision",
    description: "Finalize a candidate's pipeline status by sending either a customized Offer Letter ('hire') or a polite Rejection Email ('reject'). For 'hire', provide baseSalary and positionTitle. For 'reject', they are ignored.",
    schema: z.object({ 
      candidateId: z.string(), 
      jobId: z.string(), 
      decision: z.enum(["hire", "reject"]),
      baseSalary: z.number().optional(),
      positionTitle: z.string().optional()
    }),
  }
);

const submitInterviewFeedbackTool = tool(
  async ({ interviewId, interviewerId, comments, rating, recommendation }) => 
    JSON.stringify(await hiringToolsObj.submitInterviewFeedback(interviewId, interviewerId, comments, rating, recommendation)),
  {
    name: "submitInterviewFeedback",
    description: "Record feedback, score (1-5), and recommendation for a completed interview.",
    schema: z.object({
      interviewId: z.string(),
      interviewerId: z.string(),
      comments: z.string(),
      rating: z.number().min(1).max(5),
      recommendation: z.enum(["strong_yes", "yes", "neutral", "no", "strong_no"])
    })
  }
);

// ─── Leave Tools ──────────────────────────────────────────────────────────────
const requestLeaveTool = tool(
  async ({ employeeId, leaveType, startDate, endDate, reason, filedVia }) => {
    const res = await leaveToolsObj.requestLeave(employeeId, leaveType, startDate, endDate, reason, filedVia || "chat");
    return JSON.stringify(res);
  },
  {
    name: "requestLeave",
    description: "File a leave request on behalf of an employee. Aurion writes a professional note for HR automatically.",
    schema: z.object({
      employeeId: z.string(),
      leaveType: z.enum(["Casual", "Sick", "Earned", "Unpaid", "Paternity", "Maternity"]),
      startDate: z.string().describe("Date string e.g. '2025-04-14'"),
      endDate: z.string(),
      reason: z.string(),
      filedVia: z.enum(["voice", "chat", "manual_form"]).optional()
    }),
  }
);

const getLeaveStatusTool = tool(
  async ({ employeeId }) => JSON.stringify(await leaveToolsObj.getLeaveStatus(employeeId)),
  {
    name: "getLeaveStatus",
    description: "Get leave history and status summary for an employee.",
    schema: z.object({ employeeId: z.string() }),
  }
);

const hrRespondToLeaveIntentTool = tool(
  async ({ leaveId, decision, hrEmployeeId, comment }) => JSON.stringify({
    __special_intent: "CONFIRMATION_REQUIRED",
    action: "executeHRLeaveDecision",
    parameters: { leaveId, decision, hrEmployeeId, comment }
  }),
  {
    name: "prepareHRLeaveDecision",
    description: "Prepare an HR leave approval or rejection. Requires confirmation before executing.",
    schema: z.object({
      leaveId: z.string(),
      decision: z.enum(["Approved", "Rejected"]),
      hrEmployeeId: z.string(),
      comment: z.string().optional()
    }),
  }
);

const getPendingLeavesTool = tool(
  async () => JSON.stringify(await leaveToolsObj.getPendingLeaves()),
  {
    name: "getPendingLeaves",
    description: "Get all pending leave requests — for HR use only.",
    schema: z.object({}),
  }
);

const getLeaveBalanceTool = tool(
  async ({ employeeId }) => JSON.stringify(await leaveToolsObj.getLeaveBalance(employeeId)),
  {
    name: "getLeaveBalance",
    description: "Get the leave balance (annual, sick, casual) for an employee.",
    schema: z.object({ employeeId: z.string() }),
  }
);

// ─── Project Tools ────────────────────────────────────────────────────────────
const createProjectTool = tool(
  async ({ name, description, leadId, departmentId, startDate, endDate, priority }) =>
    JSON.stringify(await projectToolsObj.createProject(name, description, leadId, departmentId, startDate, endDate, priority)),
  {
    name: "createProject",
    description: "Create a new company project with a lead, timeline, and priority.",
    schema: z.object({
      name: z.string(), description: z.string().optional(),
      leadId: z.string().optional(), departmentId: z.string().optional(),
      startDate: z.string().optional(), endDate: z.string().optional(),
      priority: z.enum(["Low", "Medium", "High", "Critical"]).optional()
    }),
  }
);

const addMemberTool = tool(
  async ({ projectId, employeeId, role }) =>
    JSON.stringify(await projectToolsObj.addMemberToProject(projectId, employeeId, role || "Member")),
  {
    name: "addMemberToProject",
    description: "Add an employee to a project with a specific role.",
    schema: z.object({ projectId: z.string(), employeeId: z.string(), role: z.string().optional() }),
  }
);

const addMilestoneTool = tool(
  async ({ projectId, title, description, deadline }) =>
    JSON.stringify(await projectToolsObj.addMilestone(projectId, title, description, deadline)),
  {
    name: "addMilestone",
    description: "Add a milestone with a deadline to a project.",
    schema: z.object({ projectId: z.string(), title: z.string(), description: z.string().optional(), deadline: z.string().optional() }),
  }
);

const submitFeedbackTool = tool(
  async ({ projectId, employeeId, message, submittedVia }) =>
    JSON.stringify(await projectToolsObj.submitProjectFeedback(projectId, employeeId, message, submittedVia || "chat")),
  {
    name: "submitProjectFeedback",
    description: "Submit employee feedback on a project. Sentiment is analyzed by AI and health score is updated.",
    schema: z.object({
      projectId: z.string(), employeeId: z.string(),
      message: z.string(), submittedVia: z.enum(["voice", "chat", "form"]).optional()
    }),
  }
);

const getProjectStatusTool = tool(
  async ({ projectId }) => JSON.stringify(await projectToolsObj.getProjectStatus(projectId)),
  {
    name: "getProjectStatus",
    description: "Get full project status including milestones, members, feedback, and health score.",
    schema: z.object({ projectId: z.string() }),
  }
);

const getProjectHealthSummaryTool = tool(
  async ({ projectId }) => JSON.stringify(await projectToolsObj.generateProjectHealthSummary(projectId)),
  {
    name: "generateProjectHealthSummary",
    description: "Generate an AI-written health summary for a project for HR review.",
    schema: z.object({ projectId: z.string() }),
  }
);

const submitProjectUpdateTool = tool(
  async ({ projectId, employeeId, updateText, progressDelta }) =>
    JSON.stringify(await projectToolsObj.submitProjectUpdate(projectId, employeeId, updateText, progressDelta || 0)),
  {
    name: "submitProjectUpdate",
    description: "Submit a project progress update. AI will summarize it and update completion percentage.",
    schema: z.object({
      projectId: z.string(), employeeId: z.string(),
      updateText: z.string(), progressDelta: z.number().optional()
    }),
  }
);

// ─── Communication / Agent Message Tools ─────────────────────────────────────
const informHRTool = tool(
  async ({ fromEmployeeId, message }) => JSON.stringify(await commToolsObj.informHR(fromEmployeeId, message)),
  {
    name: "informHR",
    description: "Relay an important message or alert from an employee to the HR/Admin team.",
    schema: z.object({ fromEmployeeId: z.string(), message: z.string() }),
  }
);

const getHRAgentUpdatesTool = tool(
  async ({ hrId }) => JSON.stringify(await commToolsObj.getHRAgentUpdates(hrId)),
  {
    name: "getHRAgentUpdates",
    description: "Check for recorded employee messages or AI alerts left for HR.",
    schema: z.object({ hrId: z.string() }),
  }
);
const sendMailTool = tool(
  async ({ to, subject, body, toEmployeeId, relatedModule }) =>
    JSON.stringify(await mailToolsObj.sendMail({ to, subject, body, toEmployeeId, triggeredBy: "agent", relatedModule: relatedModule || "general" })),
  {
    name: "sendMail",
    description: "Compose and log a professional email. Use real recipient email addresses and do not send to generic aliases like all@company.",
    schema: z.object({
      to: z.string(), subject: z.string(), body: z.string(),
      toEmployeeId: z.string().optional(),
      relatedModule: z.enum(["hiring", "leave", "project", "onboarding", "general"]).optional()
    }),
  }
);

const getMailLogTool = tool(
  async ({ employeeId }) => JSON.stringify(await mailToolsObj.getMailLog(employeeId)),
  {
    name: "getMailLog",
    description: "Retrieve a log of sent emails for a specific employee to check status or delivery errors.",
    schema: z.object({ employeeId: z.string() }),
  }
);

// ─── Analytics Tools ──────────────────────────────────────────────────────────
const getHiringFunnelTool = tool(
  async () => JSON.stringify(await analyticsToolsObj.getHiringFunnel()),
  {
    name: "getHiringFunnel",
    description: "Get hiring pipeline data: JDs → Applications → Shortlisted → Interviewed → Offered → Hired. Follow with generateGraphData.",
    schema: z.object({}),
  }
);

const getLeaveHeatmapTool = tool(
  async () => JSON.stringify(await analyticsToolsObj.getLeaveHeatmap()),
  {
    name: "getLeaveHeatmap",
    description: "Get monthly leave usage data. Follow with generateGraphData (bar or line chart).",
    schema: z.object({}),
  }
);

const getProjectHealthReportTool = tool(
  async () => JSON.stringify(await analyticsToolsObj.getProjectHealthReport()),
  {
    name: "getProjectHealthReport",
    description: "Get health and completion scores for all active projects. Follow with generateGraphData.",
    schema: z.object({}),
  }
);

const getHeadcountTool = tool(
  async () => JSON.stringify(await analyticsToolsObj.getHeadcountByDepartment()),
  {
    name: "getHeadcountByDepartment",
    description: "Get employee count per department. Follow with generateGraphData (pie or bar chart).",
    schema: z.object({}),
  }
);

const getHRKPIsTool = tool(
  async () => JSON.stringify(await analyticsToolsObj.getHRDashboardKPIs()),
  {
    name: "getHRDashboardKPIs",
    description: "Get core HR KPIs: total employees, pending leaves, active projects, open JDs.",
    schema: z.object({}),
  }
);

// ─── Onboarding Tools ─────────────────────────────────────────────────────────
const createOnboardingPlanTool = tool(
  async ({ employeeId, role }) =>
    JSON.stringify(await onboardingToolsObj.createOnboardingPlan(employeeId, role)),
  {
    name: "createOnboardingPlan",
    description: "Create a default 10-task onboarding plan for a new hire.",
    schema: z.object({ employeeId: z.string(), role: z.string().optional() }),
  }
);

const getOnboardingProgressTool = tool(
  async ({ employeeId }) => JSON.stringify(await onboardingToolsObj.getOnboardingProgress(employeeId)),
  {
    name: "getOnboardingProgress",
    description: "Get onboarding task completion progress for a specific employee.",
    schema: z.object({ employeeId: z.string() }),
  }
);

// ─── Assessment Tools ─────────────────────────────────────────────────────────
const initAssessmentTool = tool(
  async ({ candidateId, jobId, role, skills, testType }) =>
    JSON.stringify(await assessmentToolsObj.initAssessment(candidateId, jobId, role, skills, testType)),
  {
    name: "initializeAssessment",
    description: "Start an AI assessment/test for a candidate. Generates questions automatically.",
    schema: z.object({
      candidateId: z.string(),
      jobId: z.string(),
      role: z.string(),
      skills: z.array(z.string()).optional(),
      testType: z.enum(["MCQ", "Technical", "Psychometric"]).optional()
    }),
  }
);

const getAssessmentResultsTool = tool(
  async ({ jobId }) => JSON.stringify(await assessmentToolsObj.getAssessmentResults(jobId)),
  {
    name: "getAssessmentResults",
    description: "Fetch all candidate test scores and percentages (can filter by jobId).",
    schema: z.object({ jobId: z.string().optional() }),
  }
);

const getTestDetailTool = tool(
  async ({ testId }) => JSON.stringify(await assessmentToolsObj.getTestDetail(testId)),
  {
    name: "getTestDetail",
    description: "View full details of a specific candidate test including questions and answers.",
    schema: z.object({ testId: z.string() }),
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
//  TOOL REGISTRY
// ═══════════════════════════════════════════════════════════════════════════════
const allTools = [
  // Universal DB
  listModelsTool, databaseQueryTool, databaseAggregationTool,
  updateDatabaseIntentTool, deleteDatabaseIntentTool,
  // Visualization
  generateGraphDataTool,
  // Hiring
  generateJDTool, shortlistCandidatesTool, scheduleInterviewsTool, postToPlatformTool,
  getCandidatesTool, getShortlistedCandidatesTool, finalizeCandidateDecisionTool, submitInterviewFeedbackTool,
  // Leave
  requestLeaveTool, getLeaveStatusTool, hrRespondToLeaveIntentTool,
  getPendingLeavesTool, getLeaveBalanceTool,
  // Projects
  createProjectTool, addMemberTool, addMilestoneTool,
  submitFeedbackTool, getProjectStatusTool, getProjectHealthSummaryTool,
  // Mail
  sendMailTool, getMailLogTool,
  // Analytics
  getHiringFunnelTool, getLeaveHeatmapTool, getProjectHealthReportTool,
  getHeadcountTool, getHRKPIsTool,
  // Onboarding
  createOnboardingPlanTool, getOnboardingProgressTool,
  // Assessments
  initAssessmentTool, getAssessmentResultsTool, getTestDetailTool,
  // Project Updates & Communication
  submitProjectUpdateTool, informHRTool, getHRAgentUpdatesTool
];

// ═══════════════════════════════════════════════════════════════════════════════
//  LLM
// ═══════════════════════════════════════════════════════════════════════════════
const llm = new ChatGroq({
  model: "openai/gpt-oss-safeguard-20b" || process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  apiKey: process.env.GROQ_API_KEY,
  temperature: 0,
}).bindTools(allTools, { parallel_tool_calls: false });

// ═══════════════════════════════════════════════════════════════════════════════
//  NODES
// ═══════════════════════════════════════════════════════════════════════════════
async function agentThink(state) {
  const { messages, employeeRole, employeeId, employeeName, employeeContext } = state;
  const sysMsg = new SystemMessage(buildSystemPrompt(employeeRole, employeeId, employeeName, employeeContext));

  // Ensure the model always receives the latest SystemPrompt
  // Filter out any previous system messages from history to avoid confusion
  const cleanMessages = messages.filter(m => {
    const type = typeof m.getType === 'function' ? m.getType() : (m.type || m.role);
    return type !== 'system' && type !== 'SystemMessage';
  });
  const fullMessages = [sysMsg, ...cleanMessages];

  const response = await llm.invoke(fullMessages);
  
  if (response.tool_calls?.length > 0) {
    console.log(`🤖 Agent is calling tools: ${response.tool_calls.map(tc => tc.name).join(', ')}`);
  }

  return { messages: [response] };
}

async function executeTools(state) {
  const lastMessage = state.messages[state.messages.length - 1];
  const toolCalls = lastMessage.tool_calls;
  if (!toolCalls || toolCalls.length === 0) return { messages: [] };

  let pending_action = state.pending_action;
  const toolMessages = [];

  for (const tc of toolCalls) {
    const selectedTool = allTools.find(t => t.name === tc.name);
    if (!selectedTool) continue;

    let result;
    try {
      // Handle cases where the model might send null or undefined arguments
      const args = tc.args || {};
      result = await selectedTool.invoke(args);

      const parsed = JSON.parse(result);

      if (parsed.__special_intent === "CONFIRMATION_REQUIRED") {
        pending_action = parsed;
        toolMessages.push({
          role: "tool", tool_call_id: tc.id, name: tc.name,
          content: "Intent recorded. Ask the user to confirm this action."
        });
        continue;
      }

      if (parsed.__special_intent === "RENDER_GRAPH") {
        pending_action = parsed;
        toolMessages.push({
          role: "tool", tool_call_id: tc.id, name: tc.name,
          content: "Graph data prepared and sent to the UI."
        });
        continue;
      }
    } catch (err) {
      console.error(`❌ Tool execution failed [${tc.name}]:`, err.message);
      toolMessages.push({
        role: "tool", 
        tool_call_id: tc.id, 
        name: tc.name, 
        content: `Execution error for tool '${tc.name}': ${err.message}. Please refine your parameters and try again.`
      });
      continue;
    }

    toolMessages.push({ role: "tool", tool_call_id: tc.id, name: tc.name, content: result });
  }

  return { messages: toolMessages, pending_action };
}

function shouldContinue(state) {
  const lastMessage = state.messages[state.messages.length - 1];
  // Always continue to agentThink if there were tool calls, even if special intents were set.
  // This ensures the model provides a verbal confirmation/summary.
  if (lastMessage.tool_calls?.length > 0) return "executeTools";
  return "end";
}

// ═══════════════════════════════════════════════════════════════════════════════
//  GRAPH
// ═══════════════════════════════════════════════════════════════════════════════
const workflow = new StateGraph(GraphState)
  .addNode("agentThink", agentThink)
  .addNode("executeTools", executeTools)
  .addEdge("__start__", "agentThink")
  .addConditionalEdges("agentThink", shouldContinue, {
    executeTools: "executeTools",
    end: "__end__",
  })
  .addEdge("executeTools", "agentThink")
  .compile({ checkpointer: new MemorySaver() });

// ═══════════════════════════════════════════════════════════════════════════════
//  EXECUTE CONFIRMED ACTIONS
// ═══════════════════════════════════════════════════════════════════════════════
const executeConfirmedAction = async (action) => {
  const { action: actionType, parameters: p } = action;

  switch (actionType) {
    case "executeUniversalUpdate":
      return await universalDbTools.executeUniversalUpdate(p.modelName, p.id, p.updateData);
    case "executeUniversalDelete":
      return await universalDbTools.executeUniversalDelete(p.modelName, p.id);
    case "executeHRLeaveDecision":
      return JSON.stringify(await leaveToolsObj.hrRespondToLeave(p.leaveId, p.decision, p.hrEmployeeId, p.comment));
    default:
      return `Unknown action: ${actionType}`;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════════
export const runAgent = async ({
  userInput,
  sessionId,
  employeeId = "EMP001",
  employeeRole = "employee",
  contextModule = "general",
  isConfirmation = false
}) => {
  // Handle confirmed actions
  if (isConfirmation) {
    const currentState = await workflow.getState({ configurable: { thread_id: sessionId } });
    if (currentState?.values?.pending_action) {
      const action = currentState.values.pending_action;
      const confirmed = userInput.toLowerCase().includes('yes') || userInput.toLowerCase().includes('confirm') || userInput.toLowerCase().includes('approve');

      if (confirmed) {
        const res = await executeConfirmedAction(action);
        // Clear pending action
        await workflow.updateState(
          { configurable: { thread_id: sessionId } },
          { pending_action: null },
          "agentThink"
        );
        return `✅ Action completed successfully. Result: ${res}`;
      } else {
        await workflow.updateState(
          { configurable: { thread_id: sessionId } },
          { pending_action: null },
          "agentThink"
        );
        return "❌ Action cancelled. Nothing was changed.";
      }
    }
  }

  // Fetch employee context for personalized persona
  let employeeName = "Sir/Ma'am";
  let employeeContext = {};
  try {
    const empDataRaw = await universalDbTools.databaseQuery("Employee", `{"employeeId":"${employeeId}"}`, 1);
    const empData = JSON.parse(empDataRaw);
    if (Array.isArray(empData) && empData.length > 0) {
      const e = empData[0];
      employeeName = e.firstName;
      employeeContext = {
        fullName: `${e.firstName} ${e.lastName}`,
        department: e.departmentId || "General",
        employmentType: e.employmentType,
        joiningDate: e.joiningDate,
        status: e.status
      };
    }
  } catch (e) {
    console.warn("Failed to fetch employee context, defaulting to formal address:", e.message);
  }

  const result = await workflow.invoke(
    {
      messages: [new HumanMessage(userInput)],
      employeeId,
      employeeName,
      employeeRole,
      employeeContext,
      contextModule
    },
    { configurable: { thread_id: sessionId } }
  );

  // 📝 NEW: If this is an HR user starting a session, check for recorded employee alerts
  const isHR = employeeRole === 'hr' || employeeRole === 'admin';
  if (isHR && (userInput.includes("INIT_WELCOME_FLOW") || userInput.toLowerCase().includes("hello") || userInput.toLowerCase().includes("hi"))) {
    const alerts = await commToolsObj.getHRAgentUpdates(employeeId);
    if (alerts.status === "success" && !alerts.message.includes("No new")) {
      const lastMsg = result.messages[result.messages.length - 1];
      lastMsg.content += `\n\n📌 **Sir, I have recorded messages from the team for you:**\n${alerts.message}`;
    }
  }

  const lastMessage = result.messages[result.messages.length - 1];

  // Pending confirmation required
  if (result.pending_action?.action) {
    return {
      reply: lastMessage.content,
      confirmation_required: true,
      pending_action: result.pending_action
    };
  }

  // Graph render required
  if (result.pending_action?.__special_intent === "RENDER_GRAPH") {
    const graphPayload = result.pending_action.graphPayload;

    // Clear graph pending action so it does not persist to subsequent requests.
    await workflow.updateState(
      { configurable: { thread_id: sessionId } },
      { pending_action: null },
      "agentThink"
    );

    return {
      reply: lastMessage.content,
      render_graph: true,
      graphPayload
    };
  }

  return lastMessage.content;
};
