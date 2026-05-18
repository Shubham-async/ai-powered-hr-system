import mongoose from 'mongoose';

const getModel = (name) => {
  try { return mongoose.model(name); } catch { return null; }
};

// ─── 1. Create onboarding plan for a new hire ─────────────────────────────────
export const createOnboardingPlan = async (employeeId, role = "New Hire") => {
  try {
    const OnboardingTask = getModel("OnboardingTask");
    if (!OnboardingTask) return { status: "error", message: "OnboardingTask model not loaded." };

    // Default onboarding task templates
    const defaultTasks = [
      { title: "Complete HR Documentation", category: "compliance", dueDay: 1 },
      { title: "System Access & Credentials Setup", category: "it", dueDay: 1 },
      { title: "Company Orientation & Culture Walkthrough", category: "orientation", dueDay: 2 },
      { title: "Team Introduction Meeting", category: "social", dueDay: 2 },
      { title: "Role-Specific Training — Week 1", category: "training", dueDay: 5 },
      { title: "Review Company Policies & Handbook", category: "compliance", dueDay: 5 },
      { title: "First 1:1 with Manager", category: "social", dueDay: 7 },
      { title: "30-Day Goals Setting Session", category: "performance", dueDay: 14 },
      { title: "IT Security & Data Privacy Training", category: "compliance", dueDay: 7 },
      { title: "Benefits Enrollment", category: "hr", dueDay: 10 },
    ];

    const startDate = new Date();
    const tasks = defaultTasks.map(t => ({
      employeeId,
      title: t.title,
      category: t.category,
      dueDate: new Date(startDate.getTime() + t.dueDay * 24 * 60 * 60 * 1000),
      status: "Pending"
    }));

    await OnboardingTask.insertMany(tasks);

    return {
      status: "success",
      message: `Onboarding plan created for ${role} (${employeeId}) with ${tasks.length} tasks.`,
      tasksCount: tasks.length
    };
  } catch (e) {
    return { status: "error", message: e.message };
  }
};

// ─── 2. Update status of an onboarding task ───────────────────────────────────
export const updateOnboardingTask = async (taskId, status) => {
  try {
    const OnboardingTask = getModel("OnboardingTask");
    if (!OnboardingTask) return { status: "error", message: "OnboardingTask model not loaded." };

    const task = await OnboardingTask.findByIdAndUpdate(
      taskId,
      { status, completedAt: status === "Completed" ? new Date() : null },
      { new: true }
    );

    if (!task) return { status: "error", message: "Task not found." };

    return { status: "success", message: `Task "${task.title}" marked as ${status}.` };
  } catch (e) {
    return { status: "error", message: e.message };
  }
};

// ─── 3. Get onboarding progress for an employee ───────────────────────────────
export const getOnboardingProgress = async (employeeId) => {
  try {
    const OnboardingTask = getModel("OnboardingTask");
    if (!OnboardingTask) return { status: "error", message: "OnboardingTask model not loaded." };

    const tasks = await OnboardingTask.find({ employeeId }).sort({ dueDate: 1 }).lean();
    if (!tasks.length) return { status: "error", message: "No onboarding plan found for this employee." };

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === "Completed").length;
    const overdue = tasks.filter(t => t.status !== "Completed" && new Date(t.dueDate) < new Date()).length;
    const completionPercent = Math.round((completed / total) * 100);

    return {
      status: "success",
      data: {
        total, completed, overdue, completionPercent,
        tasks: tasks.map(t => ({
          id: t._id,
          title: t.title,
          category: t.category,
          status: t.status,
          dueDate: t.dueDate,
          isOverdue: t.status !== "Completed" && new Date(t.dueDate) < new Date()
        }))
      }
    };
  } catch (e) {
    return { status: "error", message: e.message };
  }
};

// ─── 4. Get all employees currently in onboarding ─────────────────────────────
export const getActiveOnboardees = async () => {
  try {
    const OnboardingTask = getModel("OnboardingTask");
    if (!OnboardingTask) return { status: "error", message: "OnboardingTask model not loaded." };

    const pipeline = [
      { $group: { _id: "$employeeId", total: { $sum: 1 }, done: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } } } },
      { $match: { $expr: { $lt: ["$done", "$total"] } } }, // Still have pending tasks
      { $project: { employeeId: "$_id", total: 1, done: 1, percent: { $multiply: [{ $divide: ["$done", "$total"] }, 100] }, _id: 0 } }
    ];

    const data = await OnboardingTask.aggregate(pipeline);
    return { status: "success", count: data.length, data };
  } catch (e) {
    return { status: "error", message: e.message };
  }
};
