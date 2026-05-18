import { buildBaseContext } from "./baseContext.js";
import { buildEmployeeContext } from "./employeeContext.js";
import { buildOrganizationContext } from "./organizationContext.js";

export const buildContext = async ({ employeeId }) => {
  const base = buildBaseContext();
  const org = await buildOrganizationContext();

  let actor = null;

  if (employeeId) {
    actor = await buildEmployeeContext(employeeId);
  }

  return {
    ...base,
    ...org,
    actor
  };
};