import axios from "axios";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import AI from "../AI/genAI-1.0.mjs";
import dotenv from "dotenv";
dotenv.config();

const ai = new AI({
  apiKey: process.env.GROQ_API_KEY || "test_key",
});

/**
 * Generate or refine a structured JD JSON from user prompt.
 */
export async function generateAIJD(prompt, previousResponse = null) {
  try {
    const messages = [
      {
        role: "system",
        content: `You are an expert HR assistant.
You generate or refine Job Descriptions in strict JSON format.
Always return ONLY a valid JSON object.
Never include quotes (\`,\`\`\`,',"), extra space, explanations or plain text.
The JSON structure must be:

{
  "jobTitle": "string",
  "company": "string",
  "location": "string",
  "employmentType": "string",
  "skills": ["string"],
  "experience": "string",
  "salaryRange": "string",
  "aiMetadata": {
    "shortSummary": "string",
    "highlights": ["string"],
    "hashtags": ["string"]
  }
}`,
      },
    ];

    if (previousResponse) {
      messages.push({
        role: "assistant",
        content: `Here is the previously generated JD JSON:\n${JSON.stringify(previousResponse)} update information here`,
      });
    }

    messages.push({ role: "user", content: prompt });

    const aiResponse = await ai.ask(messages, "json");
    const jdJSON = typeof aiResponse === "string" ? JSON.parse(aiResponse) : aiResponse;

    return jdJSON;
  } catch (err) {
    console.error("Error generating AI JD:", err);
    throw new Error("AI JD generation failed");
  }
}

/**
 * Evaluate and shortlist candidates for a given JD using AI
 */
function withTimeout(promise, ms, msg = "Operation timed out") {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(msg)), ms))
  ]);
}

export async function shortListedCandidatesForJD(candidates, job) {
  if (!Array.isArray(candidates) || candidates.length === 0)
    throw new Error("Candidates list is empty or invalid.");
  if (!job) throw new Error("Job data is missing.");

  console.log("🚀 Starting AI evaluation for candidates...");
  const results = [];

  for (const candidate of candidates) {
    try {
      const messages = [
        {
          role: "system",
          content: `
You are an expert AI recruiter.
Analyze candidates objectively based on their skills, experience, and suitability for the given job description.
For every candidate, you MUST provide:
1. A numerical score (0-100).
2. A confidence score (0-1).
3. A recommendation.
4. A VALID AND DETAILED REASON explaining why the candidate was either SELECTED (shortlisted) or REJECTED. Mention specific skills or experience gaps.
5. A status (shortlisted or rejected).

Return output **strictly as VALID JSON ONLY** (no markdown, no explanations, no code fences, no extra text, no quotes like ',\`\`\`," at starting or ending of the response).
The JSON must exactly match this format:
{
  "score": 0-100,
  "confidence": 0-1,
  "recommendation": "Strong fit | Average fit | Weak fit | Not suitable",
  "reason": "Detailed explanation for selection or rejection",
  "status": "shortlisted | rejected"
}`,
        },
        {
          role: "user",
          content: `Candidate details: ${JSON.stringify(candidate)}
Job description: ${JSON.stringify(job)}
Now respond strictly in JSON.`,
        },
      ];

      // Ask AI (with timeout)
      const aiResponse = await withTimeout(
        ai.ask(messages, "json"),
        30000,
        "AI evaluation timeout"
      );

      // Sanitize response
      let cleanResponse = typeof aiResponse === "string" ? aiResponse : JSON.stringify(aiResponse);
      cleanResponse = cleanResponse.replace(/```json/gi, "").replace(/```/g, "").trim();

      const jsonStart = cleanResponse.indexOf("{");
      const jsonEnd = cleanResponse.lastIndexOf("}");
      if (jsonStart === -1 || jsonEnd === -1) throw new Error("AI response missing valid JSON structure.");

      const jsonString = cleanResponse.slice(jsonStart, jsonEnd + 1);
      const evaluation = JSON.parse(jsonString);

      results.push({
        candidateId: candidate._id,
        jobId: job._id,
        shortlistedAt: new Date(),
        status: evaluation.status || "rejected",
        loginId: candidate.email || null,
        password: candidate.password || null,
        aiEvaluation: {
          score: evaluation.score || 0,
          confidence: evaluation.confidence || 0,
          reasoning: evaluation.reason || evaluation.reasoning || "No detailed reason provided.",
          recommendation: evaluation.recommendation || "Unknown",
          evaluatedAt: new Date(),
        },
      });
    } catch (err) {
      console.error(`❌ Error evaluating candidate ${candidate.name}:`, err.message);
      results.push({
        candidateId: candidate._id,
        jobId: job._id,
        shortlistedAt: new Date(),
        status: "rejected",
        loginId: candidate.email || null,
        password: candidate.password || null,
        aiEvaluation: {
          score: 0,
          confidence: 0,
          reasoning: "AI evaluation failed: " + err.message,
          recommendation: "Unknown",
          evaluatedAt: new Date(),
        },
      });
    }
  }

  return results;
}

/**
 * Extracts candidate details from resume using AI
 */
import pdfParse from "pdf-parse-fixed";

export async function getCandidateDetailsFromResume(jdId, resumeUrl, buffer) {
  try {
    console.log("🔍 Starting resume parsing for:", resumeUrl);

    if (!buffer) {
      const response = await axios.get(resumeUrl, { responseType: "arraybuffer" });
      buffer = response.data;
    }
    const pdfBuffer = Buffer.from(buffer);
    const data = await pdfParse(pdfBuffer);
    const resumeText = data.text?.trim() || "";
    if (!resumeText) throw new Error("Empty or invalid PDF content");

    const prompt = `Extract candidate details from resume text. Always return ONLY valid JSON matching this schema:
    {
      "name": "string",
      "email": "string",
      "phone": "string",
      "skills": ["string"],
      "summary": "string",
      "experience": [{ "company": "string", "role": "string", "duration": "string", "description": "string" }],
      "education": [{ "institution": "string", "degree": "string", "fieldOfStudy": "string" }]
    }
    Resume Text: ${resumeText}`;

    const aiResponse = await ai.ask([{ role: "user", content: prompt }], "json");
    
    let cleanResponse = typeof aiResponse === "string" ? aiResponse : JSON.stringify(aiResponse);
    cleanResponse = cleanResponse.replace(/```json/gi, "").replace(/```/g, "").replace(/^[^{]*({[\s\S]*})[^}]*$/, "$1").trim();
    
    let candidateData = JSON.parse(cleanResponse);

    // Normalize skills: Flatten objects and ensure it's an array of strings
    if (Array.isArray(candidateData.skills)) {
      candidateData.skills = candidateData.skills.flatMap(s => 
        (typeof s === 'object' && s !== null) ? Object.values(s).flat().map(String) : String(s)
      );
    } else if (typeof candidateData.skills === 'object' && candidateData.skills !== null) {
      candidateData.skills = Object.values(candidateData.skills).flat().map(String);
    } else {
      candidateData.skills = [];
    }

    // Ensure mandatory fields
    candidateData.name = candidateData.name || "Unknown Candidate";
    candidateData.email = candidateData.email || candidateData.contact?.email || `cand_${Date.now()}@example.com`;
    candidateData.job_id = jdId;
    candidateData.resume = resumeUrl;

    return candidateData;
  } catch (error) {
    console.error("❌ Error in getCandidateDetailsFromResume:", error.message);
    throw error;
  }
}

/**
 * Generate assessment questions using AI based on job role and skills
 */
export async function generateAssessmentQuestions(role, skills) {
  try {
    console.log(`🧠 Generating AI questions for ${role}...`);
    const prompt = `Generate 3 multiple-choice questions for a candidate applying for the role of ${role}.
Focus on these skills: ${skills.join(", ")}.
Return output strictly as a VALID JSON array of objects:
[
  {
    "question_id": "q1",
    "question_text": "string",
    "options": ["A", "B", "C", "D"],
    "correct_answer": "string matching one of the options",
    "marks": 1
  }
]`;

    const aiResponse = await ai.ask([{ role: "user", content: prompt }], "json");
    
    let cleanResponse = typeof aiResponse === "string" ? aiResponse : JSON.stringify(aiResponse);
    cleanResponse = cleanResponse.replace(/```json/gi, "").replace(/```/g, "").trim();

    const jsonStart = cleanResponse.indexOf("[");
    const jsonEnd = cleanResponse.lastIndexOf("]");
    if (jsonStart === -1 || jsonEnd === -1) throw new Error("AI response missing valid JSON array structure.");

    const jsonString = cleanResponse.slice(jsonStart, jsonEnd + 1);
    const questions = JSON.parse(jsonString);

    return questions;
  } catch (error) {
    console.error("❌ Error generating assessment questions:", error.message);
    // Fallback questions if AI fails
    return [
      {
        question_id: "q1",
        question_text: `What is a core concept in ${skills[0] || "Software engineering"}?`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correct_answer: "Option A",
        marks: 1
      }
    ];
  }
}
