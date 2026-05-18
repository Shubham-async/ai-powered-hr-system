import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["user", "assistant", "system"],
    required: true
  },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const conversationSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  employeeId: { type: String, required: true },
  messages: [messageSchema],
  lastUpdated: { type: Date, default: Date.now }
});

export default mongoose.model("Conversation", conversationSchema);
import Conversation from "../models/Conversation.js";

const MAX_HISTORY = 10; // keep last 10 messages

export const loadMemory = async (sessionId) => {
  const convo = await Conversation.findOne({ sessionId });
  if (!convo) return [];
  return convo.messages.slice(-MAX_HISTORY);
};