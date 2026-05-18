import mongoose from 'mongoose';

const getModel = (name) => {
  try { return mongoose.model(name); } catch { return null; }
};

// ─── 1. Hiring Funnel ─────────────────────────────────────────────────────────
// JD posted → Applications → Shortlisted → Interviewed → Offered → Hired
export const getHiringFunnel = async () => {
  try {
    const Candidate = getModel("Candidate");
    const CandidateApplied = getModel("CandidateApplied");
    const JobDescription = getModel("JobDescription");

    const totalJDs = JobDescription ? await JobDescription.countDocuments() : 0;
    const totalCandidates = Candidate ? await Candidate.countDocuments() : 0;
    
    let stageData = [];
    if (Candidate) {
      try {
        stageData = await Candidate.aggregate([
          { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
      } catch {}
    }

    const stageMap = stageData.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {});

    const funnel = [
      { name: "Total Jobs", count: totalJDs, color: "bg-blue-500" },
      { name: "New Apps", count: stageMap["new"] || 0, color: "bg-slate-500" },
      { name: "Screening", count: stageMap["screening"] || 0, color: "bg-indigo-500" },
      { name: "Assessment", count: stageMap["assessment"] || stageMap["shortlisted"] || 0, color: "bg-purple-500" },
      { name: "Interview", count: stageMap["interview"] || 0, color: "bg-amber-500" },
      { name: "Hired", count: stageMap["hired"] || stageMap["offer"] || 0, color: "bg-green-500" },
    ];

    return { status: "success", data: funnel };
  } catch (e) {
    return { status: "error", message: e.message };
  }
};

// ─── 2. Leave Heatmap (monthly leave usage per department) ───────────────────
export const getLeaveHeatmap = async () => {
  try {
    const LeaveRequest = getModel("LeaveRequest");
    if (!LeaveRequest) return { status: "error", message: "LeaveRequest model not loaded." };

    const data = await LeaveRequest.aggregate([
      { $match: { status: "Approved" } },
      {
        $group: {
          _id: {
            month: { $month: "$startDate" },
            year: { $year: "$startDate" },
          },
          count: { $sum: 1 },
          totalDays: { $sum: "$totalDays" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      {
        $project: {
          name: {
            $concat: [
              { $arrayElemAt: [["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], { $subtract: ["$_id.month", 1] }] },
              " ", { $toString: "$_id.year" }
            ]
          },
          count: 1, totalDays: 1, _id: 0
        }
      }
    ]);

    return { status: "success", data };
  } catch (e) {
    return { status: "error", message: e.message };
  }
};

// ─── 3. Project Health Report ─────────────────────────────────────────────────
export const getProjectHealthReport = async () => {
  try {
    const Project = getModel("Project");
    if (!Project) return { status: "error", message: "Project model not loaded." };

    const projects = await Project.find({ status: "Active" })
      .select("name healthScore completionPercent status priority endDate")
      .sort({ healthScore: 1 }).lean();

    const avgHealth = projects.length
      ? Math.round(projects.reduce((s, p) => s + (p.healthScore || 50), 0) / projects.length)
      : 0;

    const chartData = projects.map(p => ({
      name: p.name,
      health: p.healthScore,
      completion: p.completionPercent
    }));

    return { status: "success", avgHealth, count: projects.length, data: chartData };
  } catch (e) {
    return { status: "error", message: e.message };
  }
};

// ─── 4. Headcount by Department ───────────────────────────────────────────────
export const getHeadcountByDepartment = async () => {
  try {
    const Employee = getModel("Employee");
    if (!Employee) return { status: "error", message: "Employee model not loaded." };

    const data = await Employee.aggregate([
      { $group: { _id: "$department", count: { $sum: 1 } } },
      { $project: { name: { $ifNull: ["$_id", "Unassigned"] }, count: 1, _id: 0 } },
      { $sort: { count: -1 } }
    ]);

    return { status: "success", data };
  } catch (e) {
    return { status: "error", message: e.message };
  }
};

// ─── 5. Leave Type Distribution ───────────────────────────────────────────────
export const getLeaveTypeDistribution = async () => {
  try {
    const LeaveRequest = getModel("LeaveRequest");
    if (!LeaveRequest) return { status: "error", message: "LeaveRequest model not loaded." };

    const data = await LeaveRequest.aggregate([
      { $group: { _id: "$leaveType", count: { $sum: 1 } } },
      { $project: { name: "$_id", count: 1, _id: 0 } }
    ]);

    return { status: "success", data };
  } catch (e) {
    return { status: "error", message: e.message };
  }
};

// ─── 6. Onboarding Completion Rate ────────────────────────────────────────────
export const getOnboardingCompletionRate = async () => {
  try {
    const OnboardingTask = getModel("OnboardingTask");
    if (!OnboardingTask) return { status: "error", message: "OnboardingTask model not loaded." };

    const data = await OnboardingTask.aggregate([
      { $group: { _id: "$employeeId", total: { $sum: 1 }, done: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } } } },
      { $project: { completionRate: { $multiply: [{ $divide: ["$done", "$total"] }, 100] }, _id: 1 } },
      { $group: { _id: null, avgRate: { $avg: "$completionRate" }, employees: { $sum: 1 } } }
    ]);

    return { status: "success", data: data[0] || { avgRate: 0, employees: 0 } };
  } catch (e) {
    return { status: "error", message: e.message };
  }
};

// ─── 7. Full HR Dashboard KPIs (summary for the overview page) ────────────────
export const getHRDashboardKPIs = async () => {
  try {
    const Employee = getModel("Employee");
    const LeaveRequest = getModel("LeaveRequest");
    const Project = getModel("Project");
    const JobDescription = getModel("JobDescription");

    const [totalEmployees, pendingLeaves, activeProjects, openJDs] = await Promise.all([
      Employee ? Employee.countDocuments() : Promise.resolve(0),
      LeaveRequest ? LeaveRequest.countDocuments({ status: "Pending" }) : Promise.resolve(0),
      Project ? Project.countDocuments({ status: "Active" }) : Promise.resolve(0),
      JobDescription ? JobDescription.countDocuments({ status: { $ne: "Closed" } }) : Promise.resolve(0),
    ]);

    return {
      status: "success",
      data: { totalEmployees, pendingLeaves, activeProjects, openJDs }
    };
  } catch (e) {
    return { status: "error", message: e.message };
  }
};
