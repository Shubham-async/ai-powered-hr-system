import axiosClient from "./axiosClient";

export const analyticsApi = {
  getKPIs: async () => {
    const response = await axiosClient.get("/analytics/kpis");
    return response.data;
  },
  
  getHiringFunnel: async () => {
    const response = await axiosClient.get("/analytics/hiring-funnel");
    return response.data;
  },

  getProjectHealth: async () => {
     const response = await axiosClient.get("/analytics/project-health");
     return response.data;
  },

  getRecentActivity: async () => {
    // Current backend doesn't have a specific recent activity tool yet, 
    // but we can compute it or mock it until tools are added.
    // For now, let's use global notification as a proxy or just mock.
    const response = await axiosClient.get("/notifications");
    return response.data;
  }
};
