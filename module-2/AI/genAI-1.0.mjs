import fetch from "node-fetch";

class AI {
  constructor({ apiKey }) {
    if (!apiKey) throw new Error("Groq API key is required");
    this.apiKey = apiKey;
    // Groq uses the standard OpenAI chat completion endpoint
    this.endpoint = "https://api.groq.com/openai/v1/chat/completions";
    this.modelName = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
  }

  /**
   * Ask AI with messages array
   * Supports standard { role, content } format
   */
  async ask(messages, answer_format = "text") {
    console.log("Starting with Groq model: " + this.modelName);

    // MOCK MODE: If key is test_key or invalid, return simulated high-quality response
    if (this.apiKey === "test_key" || !this.apiKey.startsWith("gsk_")) {
      console.warn("⚠️ Using Simulated AI Mode (Invalid/Mock Key detected)");
      return this.generateMockResponse(messages, answer_format);
    }

    // SANITIZE: Strip out _id, __v, or any other DB-specific fields
    const cleanMessages = messages.map(m => ({
      role: m.role,
      content: typeof m.content === 'object' ? JSON.stringify(m.content) : String(m.content)
    }));

    try {
      const body = {
        model: this.modelName,
        messages: cleanMessages,
        response_format: answer_format === "json" ? { type: "json_object" } : { type: "text" },
        temperature: 0.1,
      };

      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.error) {
        if (data.error.code === "invalid_api_key" || response.status === 401) {
          console.error("❌ Groq API Key Invalid. Falling back to Mock Mode.");
          return this.generateMockResponse(messages, answer_format);
        }
        throw new Error(`Groq API Error: ${data.error.message}`);
      }

      const content = data.choices[0]?.message?.content;
      if (!content) throw new Error("AI did not return a valid response");

      return answer_format === "json" ? JSON.parse(content) : content;
    } catch (error) {
      console.error("AI Request Failed:", error.message);
      return this.generateMockResponse(messages, answer_format);
    }
  }

  /**
   * Generate highly realistic mock responses for testing without API keys
   */
  generateMockResponse(messages, format) {
    const userPrompt = messages.find(m => m.role === "user")?.content || "";
    
    // 1. JD Generation Mock
    if (userPrompt.toLowerCase().includes("job description") || userPrompt.toLowerCase().includes("jd")) {
      const mockJD = {
        jobTitle: "Software Engineer",
        company: "Aurion AI",
        location: "Remote / Bengaluru",
        employmentType: "Full-time",
        skills: ["React", "Node.js", "MongoDB", "TypeScript", "AI/ML"],
        experience: "2-5 years",
        salaryRange: "₹12,00,000 - ₹25,00,000",
        aiMetadata: {
          shortSummary: "Modern engineering role focused on AI-driven HR solutions.",
          highlights: ["Innovative tech stack", "Competitive pay", "High growth"],
          hashtags: ["#Hiring", "#AI", "#Fullstack"]
        }
      };
      return format === "json" ? mockJD : JSON.stringify(mockJD);
    }

    // 2. Candidate Evaluation Mock
    if (userPrompt.toLowerCase().includes("candidate") && !userPrompt.toLowerCase().includes("extract")) {
      const mockEval = {
        score: 85,
        confidence: 0.9,
        recommendation: "Strong fit",
        reasoning: "Candidate demonstrates strong proficiency in requested technologies and relevant industry experience.",
        status: "shortlisted"
      };
      return format === "json" ? mockEval : JSON.stringify(mockEval);
    }

    // 3. Resume Extraction Mock
    if (userPrompt.toLowerCase().includes("extract") || userPrompt.toLowerCase().includes("resume")) {
      const id = Math.floor(Math.random() * 9000) + 1000;
      const mockCandidate = {
        name: `Candidate ${id}`,
        email: `candidate_${Date.now()}_${id}@example.com`,
        phone: "+91 98765 43210",
        skills: ["React", "JavaScript", "Communication", "Problem Solving"],
        summary: "Dedicated professional with experience in software development and project management.",
        experience: [{ company: "Tech Corp", role: "Software Engineer", duration: "2 years", description: "Worked on frontend features." }],
        education: [{ institution: "University of AI", degree: "Bachelor's", fieldOfStudy: "Computer Science" }]
      };
      return format === "json" ? mockCandidate : JSON.stringify(mockCandidate);
    }

    // Default Fallback
    const fallback = "Simulated response: The AI successfully processed your request.";
    return format === "json" ? { message: fallback } : fallback;
  }
}

export default AI;