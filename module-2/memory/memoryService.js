import Conversation from "../models/Conversation.js";
const MAX_HISTORY = 10; // keep last 10 messages

export const loadMemory = async (sessionId) => {
  const convo = await Conversation.findOne({ sessionId });
  if (!convo) return [];
  return convo.messages.slice(-MAX_HISTORY);
};
export const saveMemory = async (sessionId, employeeId, newMessages) => {
  let convo = await Conversation.findOne({ sessionId });

  if (!convo) {
    convo = new Conversation({
      sessionId,
      employeeId,
      messages: []
    });
  }

  convo.messages.push(...newMessages);
  convo.lastUpdated = new Date();

  await convo.save();
};