import AI from "../AI/genAI-1.0.mjs";

const ai = new AI({
  apiKey: process.env.GROQ_API_KEY,
});

export const getHRDecision = async (employeeText) => {
  const messages = [
    {
      role: "system",
      content: `
You are an enterprise HR workforce assistant.

Your job:
Classify employee requests into one of:
- Attendance
- Leave
- Shift
- Compliance
- Workforce Planning

You MUST return STRICT JSON only.

Format:
{
  "module": "",
  "intent": "",
  "requiresApproval": true/false,
  "confidence": 0-100
}

If unsure, set confidence below 60.
Never return text outside JSON.
      `,
    },
    {
      role: "user",
      content: employeeText,
    },
  ];

  const aiResponse = await ai.ask(messages, "json");

  // 🛡 Safety parse
  let parsed;
  try {
    parsed = JSON.parse(aiResponse);
  } catch (err) {
    throw new Error("Invalid JSON from AI");
  }

  return parsed;
};