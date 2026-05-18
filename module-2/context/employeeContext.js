import Employee from "../models/Employee.js";
import ProjectAssignment from "../models/ProjectAssignment.js";
import ShiftAssignment from "../models/ShiftAssignment.js";
import LeaveBalance from "../models/LeaveBalance.js";

export const buildEmployeeContext = async (employeeId) => {
  const employee = await Employee.findOne({ employeeId })
    .populate("departmentId")
    .populate("roleId")
    .populate("managerId");

  if (!employee) {
    throw new Error("Employee not found");
  }

  const currentYear = new Date().getFullYear();

  const leaveBalance = await LeaveBalance.findOne({
    employeeId: employee._id,
    year: currentYear
  });

  const projects = await ProjectAssignment.find({
    employeeId: employee._id
  }).populate("projectId");

  const shift = await ShiftAssignment.findOne({
    employeeId: employee._id
  }).populate("shiftId");

  return {
    identity: {
      employeeId: employee.employeeId,
      objectId: employee._id
    },
    role: {
      title: employee.roleId?.title,
      permissions: employee.roleId?.permissions || []
    },
    department: employee.departmentId?.name,
    managerId: employee.managerId?._id,
    employmentType: employee.employmentType,
    status: employee.status,
    projects: projects.map(p => ({
      name: p.projectId?.name,
      allocation: p.allocationPercentage
    })),
    shift: shift?.shiftId?.name || null,
    leaveSnapshot: leaveBalance
      ? {
          casualRemaining:
            leaveBalance.casualLeave - leaveBalance.usedCasual,
          sickRemaining:
            leaveBalance.sickLeave - leaveBalance.usedSick,
          earnedRemaining:
            leaveBalance.earnedLeave - leaveBalance.usedEarned
        }
      : null
  };
};