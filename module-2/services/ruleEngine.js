export const applyHRRules = (decision) => {
  const { module, requiresApproval, confidence } = decision;

  // Low confidence → Escalate
  if (confidence < 60) {
    return {
      message:
        "Your request has been forwarded to HR for manual review.",
      action: "ESCALATED",
    };
  }

  if (module === "Leave") {
    return {
      message: requiresApproval
        ? "Your leave request has been sent to your manager."
        : "Your leave is automatically approved.",
      action: requiresApproval ? "PENDING_APPROVAL" : "AUTO_APPROVED",
    };
  }

  if (module === "Attendance") {
    return {
      message: "Your attendance correction request has been recorded.",
      action: "RECORDED",
    };
  }

  if (module === "Shift") {
    return {
      message: "Your shift change request has been submitted.",
      action: "PENDING_REVIEW",
    };
  }

  return {
    message: "Your request has been logged.",
    action: "LOGGED",
  };
};