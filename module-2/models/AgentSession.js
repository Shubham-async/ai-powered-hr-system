import mongoose from "mongoose";

const agentSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true },
  employeeRole: { type: String, enum: ["employee", "hr", "admin", "candidate"], default: "employee" },

  // Active module context
  contextModule: {
    type: String,
    enum: ["hiring", "leave", "projects", "analytics", "general"],
    default: "general"
  },

  // Conversation history (trimmed to last 20 messages for persistence)
  history: [{
    role: { type: String, enum: ["human", "ai", "tool"] },
    content: String,
    timestamp: { type: Date, default: Date.now }
  }],

  // Live state
  pendingAction: { type: mongoose.Schema.Types.Mixed, default: null },
  waitingForConfirmation: { type: Boolean, default: false },

  // Session timestamps
  lastActive: { type: Date, default: Date.now },
  connectedAt: { type: Date, default: Date.now }

}, { timestamps: true });

agentSessionSchema.index({ employeeId: 1, lastActive: -1 });

export default mongoose.model("AgentSession", agentSessionSchema);
