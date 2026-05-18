import { runAgent } from "../agent/agentLoop.js";
import { buildContext } from "../context/contextBuilder.js";
export const processRequest = async (req, res) => {
  try {
    const { text, employeeId, sessionId } = req.body;

    const context = await buildContext({ employeeId });

    const reply = await runAgent({
      userInput: text,
      context,
      sessionId,
      employeeId
    });

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Agent error." });
  }
};