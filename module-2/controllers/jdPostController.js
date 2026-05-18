import JD from "../models/jdModel.js";
import axios from "axios";

// const DEMO_PORTAL_URL = "https://aurion-jobs.onrender.com/api/external/jobs";
// const DEMO_PORTAL_URL = "https://aurion-jobs.onrender.com/api/external/jobs";
const DEMO_PORTAL_KEY = "sk_demo_portal_12345";
const DEMO_PORTAL_URL = "http://localhost:4000/api/external/jobs";

export async function jdPostController(req, res) {
  try {
    const { id } = req.params;
    const { platforms } = req.body;

    const jd = await JD.findById(id);
    if (!jd) {
      return res.status(404).json({ success: false, message: "JD not found" });
    }

    // Update JD status and platforms
    jd.status = "posted";
    jd.postedPlatforms = platforms || [];
    await jd.save();

    console.log(`📤 JD ${id} marked as POSTED on internal DB.`);

    // --- External Integrations ---
    const broadcastResults = [];

    // 1. Post to Demo Portal (Aurion Portal)
    if (platforms.includes("custom")) {
      try {
        console.log(`🚀 Broadcasting to Demo Portal: ${jd.aiResponse.jobTitle}`);
        const response = await axios.post(DEMO_PORTAL_URL, {
          job_id: jd._id,
          role: jd.aiResponse.jobTitle,
          title: jd.aiResponse.jobTitle,
          description: jd.aiResponse.aiMetadata?.shortSummary || "High growth role at Aurion.",
          requirements: jd.aiResponse.skills?.join(", ") || "",
          experienceLevel: jd.aiResponse.experience || "Entry",
          location: jd.aiResponse.location || "Remote",
          company: jd.aiResponse.company || "Aurion AI"
        }, {
          headers: { "x-api-key": DEMO_PORTAL_KEY }
        });
        broadcastResults.push({ platform: "custom", success: true });
      } catch (err) {
        console.error(`❌ Failed to post to Demo Portal:`, err.message);
        broadcastResults.push({ platform: "custom", success: false, error: err.message });
      }
    }

    return res.status(200).json({
      success: true,
      message: `JD published successfully!`,
      broadcast: broadcastResults,
      data: jd
    });
  } catch (error) {
    console.error("JD Post Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to post JD",
      error: error.message
    });
  }
}
