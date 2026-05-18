import fetch from "node-fetch";

class AI {
  constructor({ apiKey }) {
    if (!apiKey) throw new Error("API key is required");
    this.apiKey = apiKey;
    this.endpoint = "https://openrouter.ai/api/v1/chat/completions";
  }

  /**
   * Ask AI with messages array
   * @param {Array} messages - [{ role: "system"|"user"|"assistant", content: string }]
   * @param {string} answer_format - "json" or "text"
   * @returns {Promise<string|Object>}
   */
  async ask(messages, answer_format = "text") {
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages, // send the array of messages directly
        answer_format, // optional, your AI backend can handle
      }),
    });

    const data = await response.json();
    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new Error("AI did not return a valid response");
    }

    return data.choices[0].message.content;
  }
}

export default AI;
