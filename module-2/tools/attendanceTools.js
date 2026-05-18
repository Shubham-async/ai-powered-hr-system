
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
