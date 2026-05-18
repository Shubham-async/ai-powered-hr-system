
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
