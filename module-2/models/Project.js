import mongoose from "mongoose";

const milestoneSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  deadline: { type: Date },
  status: {
    type: String,
    enum: ["Not Started", "In Progress", "Completed", "Delayed"],
    default: "Not Started"
  },
  completedAt: Date
}, { _id: true, timestamps: true });

const memberSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  role: { type: String, default: "Member" }, // "Lead", "Member", "Reviewer"
  joinedAt: { type: Date, default: Date.now }
}, { _id: false });

const feedbackSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  message: { type: String, required: true },
  sentiment: { type: String, enum: ["Positive", "Neutral", "Negative", "Unknown"], default: "Unknown" },
  sentimentScore: { type: Number, min: -1, max: 1, default: 0 }, // -1 = very negative, +1 = very positive
  submittedVia: { type: String, enum: ["voice", "chat", "form"], default: "form" }
}, { _id: true, timestamps: true });

const statusUpdateSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  updateText: { type: String, required: true },
  progressDelta: { type: Number, default: 0 }, // optional increment in completion %
  aiSummary: String,
  timestamp: { type: Date, default: Date.now }
}, { _id: true });

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  tags: [String],

  // Ownership
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  projectLeadId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },

  // Timeline
  startDate: Date,
  endDate: Date,

  // Status
  status: {
    type: String,
    enum: ["Active", "Completed", "On Hold", "Cancelled"],
    default: "Active"
  },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High", "Critical"],
    default: "Medium"
  },

  // Team
  members: [memberSchema],

  // Milestones
  milestones: [milestoneSchema],

  // Feedback & Health
  feedbackLog: [feedbackSchema],
  statusUpdates: [statusUpdateSchema],
  healthScore: { type: Number, min: 0, max: 100, default: 50 }, // AI-computed
  lastHealthUpdate: Date,

  // Progress (auto-computed)
  completionPercent: { type: Number, default: 0 }

}, { timestamps: true });

// Auto-compute completion % based on milestones
projectSchema.methods.recomputeCompletion = function () {
  if (!this.milestones.length) return;
  const done = this.milestones.filter(m => m.status === "Completed").length;
  this.completionPercent = Math.round((done / this.milestones.length) * 100);
};

export default mongoose.model("Project", projectSchema);