
import * as employeeTools from "./employeeTools.js";
import * as departmentTools from "./departmentTools.js";
import * as projectTools from "./projectTools.js";
import * as leaveTools from "./leaveTools.js";
import * as shiftTools from "./shiftTools.js";
import * as attendanceTools from "./attendanceTools.js";
import * as metaTools from "./metaTools.js";
import * as commTools from "./agentCommunicationTools.js";
const tools = {
  ...employeeTools,
  ...departmentTools,
  ...projectTools,
  ...leaveTools,
  ...shiftTools,
  ...attendanceTools,
  ...metaTools,
  ...commTools
};

// helper assignment moved below the function declaration to avoid
// temporal-dead-zone errors (getToolSchema is defined later in this file).
// tools/metaTools.js
export const getToolSchema = (toolName) => {
  const tool = tools[toolName];
  if (!tool) return { error: "Tool not found" };

  // Extract params dynamically
  const params = tool.toString()
    .split(')')[0].split('(').pop()
    .replace(/\s+/g, '').split(',');

  return {
    tool: toolName,
    requiredParameters: params,
    instructions: `Before calling ${toolName}, ensure you have all these fields from the user.`
  };
};

// export the helper inside the tools map too so the agent can call it
// via the standard tool-dispatch mechanism
tools.getToolSchema = getToolSchema;
export const runTool = async (toolName, parameters) => {
  if (!tools[toolName]) {
    throw new Error("Tool not found: " + toolName);
  }
  return await tools[toolName](...Object.values(parameters));
};

export const listTools = () => Object.keys(tools);

export const listToolsWithSignatures = () => {
  return Object.entries(tools).map(([name, func]) => {
    // This regex extracts the parameter names from the function definition
    const params = func.toString()
      .replace(/[/][*][^]*?[*][/]/g, '') // strip comments
      .split(')')[0].split('(').pop()  // get content between ()
      .replace(/\s+/g, '')              // strip spaces
      .split(',')                       // split by comma
      .filter(p => p);                  // remove empty
    
    return `${name}(${params.join(", ")})`;
  });
};

// convenience wrappers for model-related helpers that live inside the
// tools map.  This keeps the agent code simple – it can import these
// directly instead of reaching into the map itself.
export const listModels = () => {
  if (typeof tools.listModels === 'function') {
    return tools.listModels();
  }
  return [];
};

export const getModelSchema = (modelName) => {
  if (typeof tools.getModelSchema === 'function') {
    return tools.getModelSchema(modelName);
  }
  return { error: 'Model schema helper not available' };
};