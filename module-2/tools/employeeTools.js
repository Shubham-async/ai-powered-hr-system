
import Employee from "../models/Employee.js";
import {
  createRecord,
  getById,
  findRecords,
  updateRecord,
  deleteRecord,
  searchRecords
} from "./base/crudTools.js";
import { countRecords } from "./base/crudTools.js";

export const countEmployees = (filter = {}) =>
  countRecords(Employee, filter);

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
