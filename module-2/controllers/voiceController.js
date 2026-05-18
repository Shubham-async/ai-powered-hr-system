import { getHRDecision } from "../services/decisionService.js";
import { applyHRRules } from "../services/ruleEngine.js";

export const processVoice = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ reply: "No text received." });
    }

    const decision = await getHRDecision(text);

    const finalDecision = applyHRRules(decision);

    res.json({
      reply: finalDecision.message,
      meta: decision,
    });
  } catch (error) {
    console.error("Voice Processing Error:", error);
    res.json({
      reply: "Sorry, I couldn't process your request.",
    });
  }
};