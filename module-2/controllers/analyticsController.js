import * as analyticsToolsObj from '../tools/analyticsTools.js';

// GET /api/analytics/kpis
export const getKPIs = async (req, res) => {
  try {
    const result = await analyticsToolsObj.getHRDashboardKPIs();
    res.json(result);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// GET /api/analytics/hiring-funnel
export const getHiringFunnel = async (req, res) => {
  try {
    const result = await analyticsToolsObj.getHiringFunnel();
    res.json(result);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// GET /api/analytics/leave-heatmap
export const getLeaveHeatmap = async (req, res) => {
  try {
    const result = await analyticsToolsObj.getLeaveHeatmap();
    res.json(result);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// GET /api/analytics/project-health
export const getProjectHealth = async (req, res) => {
  try {
    const result = await analyticsToolsObj.getProjectHealthReport();
    res.json(result);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// GET /api/analytics/headcount
export const getHeadcount = async (req, res) => {
  try {
    const result = await analyticsToolsObj.getHeadcountByDepartment();
    res.json(result);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// GET /api/analytics/leave-distribution
export const getLeaveDistribution = async (req, res) => {
  try {
    const result = await analyticsToolsObj.getLeaveTypeDistribution();
    res.json(result);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// GET /api/analytics/onboarding
export const getOnboardingStats = async (req, res) => {
  try {
    const result = await analyticsToolsObj.getOnboardingCompletionRate();
    res.json(result);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
