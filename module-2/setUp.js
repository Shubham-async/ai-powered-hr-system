import fs from "fs";
import path from "path";

const root = process.cwd();
const toolsDir = path.join(root, "tools");
const baseDir = path.join(toolsDir, "base");

// Create folders
if (!fs.existsSync(toolsDir)) fs.mkdirSync(toolsDir);
if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir);

// ---------------- BASE CRUD ENGINE ----------------

const crudTools = `
// Generic CRUD Engine

export const createRecord = async (Model, data) => {
  return await Model.create(data);
};

export const getById = async (Model, id, populate = []) => {
  let query = Model.findById(id);
  populate.forEach(p => query = query.populate(p));
  return await query;
};

export const findRecords = async (Model, filter = {}, options = {}) => {
  let query = Model.find(filter);

  if (options.populate) {
    options.populate.forEach(p => {
      query = query.populate(p);
    });
  }

  if (options.limit) query = query.limit(options.limit);
  if (options.sort) query = query.sort(options.sort);
  if (options.skip) query = query.skip(options.skip);

  return await query;
};

export const updateRecord = async (Model, id, data) => {
  return await Model.findByIdAndUpdate(id, data, { new: true });
};

export const deleteRecord = async (Model, id) => {
  return await Model.findByIdAndDelete(id);
};

export const searchRecords = async (Model, fields, keyword) => {
  const regex = new RegExp(keyword, "i");
  return await Model.find({
    $or: fields.map(f => ({ [f]: regex }))
  });
};
`;

fs.writeFileSync(path.join(baseDir, "crudTools.js"), crudTools);

// ---------------- EMPLOYEE TOOLS ----------------

const employeeTools = `
import Employee from "../models/Employee.js";
import {
  createRecord,
  getById,
  findRecords,
  updateRecord,
  deleteRecord,
  searchRecords
} from "./base/crudTools.js";

export const createEmployee = (data) =>
  createRecord(Employee, data);

export const getEmployeeById = (id) =>
  getById(Employee, id, ["managerId","departmentId","roleId"]);

export const listEmployees = (filter, options) =>
  findRecords(Employee, filter, options);

export const updateEmployee = (id, data) =>
  updateRecord(Employee, id, data);

export const deleteEmployee = (id) =>
  deleteRecord(Employee, id);

export const searchEmployees = (keyword) =>
  searchRecords(Employee, ["firstName","lastName","email"], keyword);
`;

fs.writeFileSync(path.join(toolsDir, "employeeTools.js"), employeeTools);

// ---------------- DEPARTMENT TOOLS ----------------

const departmentTools = `
import Department from "../models/Department.js";
import {
  createRecord,
  getById,
  findRecords,
  updateRecord,
  deleteRecord,
  searchRecords
} from "./base/crudTools.js";

export const createDepartment = (data) =>
  createRecord(Department, data);

export const getDepartmentById = (id) =>
  getById(Department, id, ["headId"]);

export const listDepartments = (filter, options) =>
  findRecords(Department, filter, options);

export const updateDepartment = (id, data) =>
  updateRecord(Department, id, data);

export const deleteDepartment = (id) =>
  deleteRecord(Department, id);

export const searchDepartments = (keyword) =>
  searchRecords(Department, ["name"], keyword);
`;

fs.writeFileSync(path.join(toolsDir, "departmentTools.js"), departmentTools);

// ---------------- PROJECT TOOLS ----------------

const projectTools = `
import Project from "../models/Project.js";
import ProjectAssignment from "../models/ProjectAssignment.js";
import {
  createRecord,
  getById,
  findRecords,
  updateRecord,
  deleteRecord,
  searchRecords
} from "./base/crudTools.js";

export const createProject = (data) =>
  createRecord(Project, data);

export const getProjectById = (id) =>
  getById(Project, id, ["projectLeadId","departmentId"]);

export const listProjects = (filter, options) =>
  findRecords(Project, filter, options);

export const updateProject = (id, data) =>
  updateRecord(Project, id, data);

export const deleteProject = (id) =>
  deleteRecord(Project, id);

export const searchProjects = (keyword) =>
  searchRecords(Project, ["name"], keyword);

export const assignEmployeeToProject = (data) =>
  createRecord(ProjectAssignment, data);

export const listProjectAssignments = (filter, options) =>
  findRecords(ProjectAssignment, filter, options);
`;

fs.writeFileSync(path.join(toolsDir, "projectTools.js"), projectTools);

// ---------------- LEAVE TOOLS ----------------

const leaveTools = `
import LeaveRequest from "../models/LeaveRequest.js";
import LeaveBalance from "../models/LeaveBalance.js";
import {
  createRecord,
  getById,
  findRecords,
  updateRecord,
  deleteRecord
} from "./base/crudTools.js";

export const createLeaveRequest = (data) =>
  createRecord(LeaveRequest, data);

export const listLeaveRequests = (filter, options) =>
  findRecords(LeaveRequest, filter, options);

export const updateLeaveRequest = (id, data) =>
  updateRecord(LeaveRequest, id, data);

export const deleteLeaveRequest = (id) =>
  deleteRecord(LeaveRequest, id);

export const getLeaveBalance = (employeeId, year) =>
  LeaveBalance.findOne({ employeeId, year });

export const updateLeaveBalance = (id, data) =>
  updateRecord(LeaveBalance, id, data);
`;

fs.writeFileSync(path.join(toolsDir, "leaveTools.js"), leaveTools);

// ---------------- SHIFT TOOLS ----------------

const shiftTools = `
import Shift from "../models/Shift.js";
import ShiftAssignment from "../models/ShiftAssignment.js";
import {
  createRecord,
  getById,
  findRecords,
  updateRecord,
  deleteRecord
} from "./base/crudTools.js";

export const createShift = (data) =>
  createRecord(Shift, data);

export const getShiftById = (id) =>
  getById(Shift, id);

export const listShifts = (filter, options) =>
  findRecords(Shift, filter, options);

export const updateShift = (id, data) =>
  updateRecord(Shift, id, data);

export const deleteShift = (id) =>
  deleteRecord(Shift, id);

export const assignShift = (data) =>
  createRecord(ShiftAssignment, data);

export const listShiftAssignments = (filter, options) =>
  findRecords(ShiftAssignment, filter, options);
`;

fs.writeFileSync(path.join(toolsDir, "shiftTools.js"), shiftTools);

// ---------------- ATTENDANCE TOOLS ----------------

const attendanceTools = `
import Attendance from "../models/Attendance.js";
import {
  createRecord,
  findRecords,
  updateRecord,
  deleteRecord
} from "./base/crudTools.js";

export const markAttendance = (data) =>
  createRecord(Attendance, data);

export const listAttendance = (filter, options) =>
  findRecords(Attendance, filter, options);

export const updateAttendance = (id, data) =>
  updateRecord(Attendance, id, data);

export const deleteAttendance = (id) =>
  deleteRecord(Attendance, id);
`;

fs.writeFileSync(path.join(toolsDir, "attendanceTools.js"), attendanceTools);

// ---------------- TOOL REGISTRY ----------------

const indexTools = `
import * as employeeTools from "./employeeTools.js";
import * as departmentTools from "./departmentTools.js";
import * as projectTools from "./projectTools.js";
import * as leaveTools from "./leaveTools.js";
import * as shiftTools from "./shiftTools.js";
import * as attendanceTools from "./attendanceTools.js";

const tools = {
  ...employeeTools,
  ...departmentTools,
  ...projectTools,
  ...leaveTools,
  ...shiftTools,
  ...attendanceTools
};

export const runTool = async (toolName, parameters) => {
  if (!tools[toolName]) {
    throw new Error("Tool not found: " + toolName);
  }
  return await tools[toolName](...Object.values(parameters));
};

export const listTools = () => Object.keys(tools);
`;

fs.writeFileSync(path.join(toolsDir, "index.js"), indexTools);

console.log("✅ FULL TOOL LAYER CREATED SUCCESSFULLY");