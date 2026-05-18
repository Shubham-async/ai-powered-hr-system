import AI from "../AI/genAI-1.0.mjs";
import { runTool, listTools, listToolsWithSignatures, listModels, getModelSchema, getToolSchema } from "../tools/index.js";
import { loadMemory, saveMemory } from "../memory/memoryService.js";

const ai = new AI({
    apiKey: process.env.GROQ_API_KEY,
});

const MAX_STEPS = 8; // Increased slightly to allow for Lookup -> Schema -> Action

// Flows
const AGENT_FLOWS = {
    WELCOME: `You are Aurion in 'Greeting Mode'. Be cheerful and welcoming. 
              Briefly mention that you are checking for new HR updates. 
              Your first action should be to fetch new/pending requests to brief the user.`,
    
    DISCOVERY: `You are in 'Analysis Mode'. You have fetched new data. 
                Summarize pending leave requests or employee updates clearly for the HR manager.
                Ask which one they would like to address first.`,
    
    EXECUTION: `You are in 'Action Mode'. The HR manager has given a command.
                Strictly follow the Relational Data Rule: Convert Business IDs to ObjectIds before writing.
                Perform the tool call and confirm success.`
};


export const runAgent = async ({ userInput, context, sessionId, employeeId, flowType = "WELCOME" }) => {
    let step = 0;
    const memoryMessages = await loadMemory(sessionId);
    // Dynamic Instruction Selection
    const currentFlowPrompt = AGENT_FLOWS[flowType] || AGENT_FLOWS.EXECUTION;
    // Added explicit instruction to NEVER describe the process
    const systemInstruction = `
    
You are an autonomous HR Workforce Agent named Aurion.
${currentFlowPrompt}
Available tools: ${listToolsWithSignatures().join("\n")}
Available Data Models: ${listModels().join(", ")}

### MANDATORY PROTOCOL
1. Respond ONLY in JSON. No prose, no "I'm checking", no "Wait a moment".
2. Format: {"action": "toolName", "parameters": {...}} OR {"action": "respond", "message": "..."}
3. If a tool returns data, analyze it and take the next step immediately.
4. **Relational Data Rule:** If you have a Business ID (EMP001), you MUST call a tool to find its '_id' (ObjectId) before using it in a model that requires an ObjectId. Use getModelSchema if unsure of types.
5. If a tool fails, explain why in a 'respond' action or try a different tool.
6. Never output the same tool call twice in a row with the same parameters if it failed.
7. If user gives you input of id then it will never be object id. Always assume it's a business id and you have to find object id before using it in any tool.
8 Whenever you respond to human always respond in a way that human can understand. if any error occured try to fix or ask for help.
`;

    let messages = [
        { role: "system", content: systemInstruction },
        ...memoryMessages,
        { role: "user", content: `Context: ${JSON.stringify(context)}\nRequest: ${userInput}` }
    ];

    while (step < MAX_STEPS) {
        step++;
        let raw = await ai.ask(messages, "json");
        let parsed;

        try {
            // Robust parsing for various LLM outputs
            const cleanRaw = typeof raw === "string" ? raw.replace(/```json|```/g, "").trim() : raw;
            parsed = typeof cleanRaw === "string" ? JSON.parse(cleanRaw) : cleanRaw;
            
            // Critical Fix: Prevent "I am checking" responses from breaking the flow
            if (parsed.action === "respond" && (parsed.message.toLowerCase().includes("checking") || parsed.message.toLowerCase().includes("waiting"))) {
                console.warn("Agent attempted filler response. Re-prompting for action.");
                messages.push({ role: "system", content: "Error: Do not provide status updates. Execute the next necessary tool call or provide the final answer." });
                continue; 
            }
        } catch (e) {
            console.error("Parse Error:", raw);
            messages.push({ role: "system", content: "Your last response was not valid JSON. Please retry using the correct format." });
            continue;
        }

        console.log(`Step ${step} - Action: ${parsed.action}`);

        // Handle terminal response
        if (parsed.action === "respond") {
            await saveMemory(sessionId, employeeId, [
                { role: "user", content: userInput },
                { role: "assistant", content: parsed.message }
            ]);
            return parsed.message;
        }

        // Tool Execution Logic
        try {
            if (!listTools().includes(parsed.action)) {
                throw new Error(`Tool '${parsed.action}' does not exist.`);
            }

            const result = await runTool(parsed.action, parsed.parameters || {});
            console.log(result)
            // Push the Assistant's thought and the System's result to history
            messages.push({ role: "assistant", content: JSON.stringify(parsed) });
            messages.push({ 
                role: "system", 
                content: `Tool Result: ${JSON.stringify(result)}. Now, provide the next action or final response.` 
            });


        } catch (error) {
            console.error("Tool Execution Error:", error.message);
            messages.push({ role: "assistant", content: JSON.stringify(parsed) });
            messages.push({ 
                role: "system", 
                content: `Error executing tool: ${error.message}. Please correct your parameters or try a different approach.` 
            });
        }
    }

    const escalationMessage = "I've encountered a complex technical issue. An HR representative will review this request.";
    await saveMemory(sessionId, employeeId, [{ role: "user", content: userInput }, { role: "assistant", content: escalationMessage }]);
    return escalationMessage;
};