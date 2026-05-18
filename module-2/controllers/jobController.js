import JD from "../models/jdModel.js";
import { generateAIJD } from "../services/aiService.js";

export const generateJD = async (req, res) => {
  try {
    const { role, requirements, experienceLevel, prompt } = req.body;
    
    // Use the prompt if provided, otherwise construct it from fields
    const fullPrompt = prompt || `Create a job description for a ${role} with the following requirements: ${requirements}. Experience level: ${experienceLevel}.`;
    
    const aiJd = await generateAIJD(fullPrompt);
    
    const newJd = new JD({
      prompt: fullPrompt,
      aiResponse: aiJd,
      status: "completed",
      approvalStatus: "pending"
    });

    await newJd.save();
    
    res.status(201).json({ 
      success: true, 
      message: "Job Description generated successfully!",
      data: newJd 
    });
  } catch (error) {
    console.error("Error generating JD:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const getJDById = async (req, res) => {
  try {
    const jd = await JD.findById(req.params.id);
    if (!jd) return res.status(404).json({ success: false, message: "JD not found" });
    res.status(200).json({ success: true, data: jd });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateJD = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Support both direct ID or jdId in body if needed (for legacy compatibility)
    const targetId = id || updateData.jdId;
    
    const jd = await JD.findByIdAndUpdate(targetId, updateData, { new: true });
    if (!jd) return res.status(404).json({ success: false, message: "JD not found" });
    
    res.status(200).json({ success: true, data: jd });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteJD = async (req, res) => {
  try {
    const { id } = req.params;
    const targetId = id || req.body.jdId;
    
    const jd = await JD.findByIdAndDelete(targetId);
    if (!jd) return res.status(404).json({ success: false, message: "JD not found" });
    
    res.status(200).json({ success: true, message: "JD deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllJDs = async (req, res) => {
  try {
    const jds = await JD.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: jds });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};
