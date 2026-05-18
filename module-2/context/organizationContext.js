import Department from "../models/Department.js";
import Project from "../models/Project.js";
import Employee from "../models/Employee.js";

export const buildOrganizationContext = async () => {
  const employeeCount = await Employee.countDocuments({});
  const departmentCount = await Department.countDocuments({});
  const activeProjects = await Project.countDocuments({ status: "Active" });

  return {
    organization: {
      totalEmployees: employeeCount,
      totalDepartments: departmentCount,
      activeProjects
    }
  };
};