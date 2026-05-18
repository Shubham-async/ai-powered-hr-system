// tools/metaTools.js
import dotenv from 'dotenv';
import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import Project from '../models/Project.js';
import ProjectAssignment from '../models/ProjectAssignment.js';
import Role from '../models/Role.js';
import LeaveRequest from '../models/LeaveRequest.js';
import LeaveBalance from '../models/LeaveBalance.js';
import Shift from '../models/Shift.js';
import ShiftAssignment from '../models/ShiftAssignment.js';
import Attendance from '../models/Attendance.js';
import Conversation from '../models/Conversation.js';

dotenv.config();

/**
 * Return a list of available MongoDB model names.
 * These represent the data entities the agent can query and manipulate.
 */
export const listModels = () => {
  return [
    'Employee',
    'Department',
    'Project',
    'ProjectAssignment',
    'Role',
    'LeaveRequest',
    'LeaveBalance',
    'Shift',
    'ShiftAssignment',
    'Attendance',
    'Conversation'
  ];
};

/**
 * Provide schema information for a given MongoDB model.
 * Returns the model's collection of fields and their types.
 */
export const getModelSchema = (modelName) => {
  const modelMap = {
    Employee,
    Department,
    Project,
    ProjectAssignment,
    Role,
    LeaveRequest,
    LeaveBalance,
    Shift,
    ShiftAssignment,
    Attendance,
    Conversation
  };

  const model = modelMap[modelName];
  if (!model) {
    return { error: `Model '${modelName}' not found. Available models: ${listModels().join(', ')}` };
  }

  // Extract schema fields from the model
  const schema = model.schema;
  const fields = {};

  Object.keys(schema.paths).forEach(path => {
    if (path === '_id' || path === '__v') return;

    const schemaType = schema.paths[path];
    fields[path] = {
      type: schemaType.instance,
      required: schemaType.isRequired,
      description: schemaType.options.description || ''
    };
  });

  return {
    model: modelName,
    collection: model.collection.name,
    fields: fields
  };
};
