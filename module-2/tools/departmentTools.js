
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
