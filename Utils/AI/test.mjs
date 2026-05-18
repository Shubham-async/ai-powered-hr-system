import 'dotenv/config'
import AI from './genAI-1.0.mjs'

let ai = new AI({ apiKey:process.env.OPENROUTER_API_KEY})
ai.ask({ question: "Explain quantum computing in simple terms", answer_format: "text" })
  .then(response => {
    console.log("AI Response:", response)
  })