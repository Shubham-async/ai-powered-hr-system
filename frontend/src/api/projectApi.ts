import axiosClient from "./axiosClient";

export const projectApi = {
  getAll: async () => {
    const response = await axiosClient.get("/projects");
    return response.data;
  },

  getById: async (id: string) => {
    const response = await axiosClient.get(`/projects/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await axiosClient.post("/projects", data);
    return response.data;
  },

  addMember: async (projectId: string, data: { employeeId: string; role: string }) => {
    const response = await axiosClient.post(`/projects/${projectId}/members`, data);
    return response.data;
  },

  addMilestone: async (projectId: string, data: { title: string; description: string; deadline: string }) => {
    const response = await axiosClient.post(`/projects/${projectId}/milestones`, data);
    return response.data;
  },

  updateMilestone: async (projectId: string, milestoneId: string, status: string) => {
    const response = await axiosClient.patch(`/projects/${projectId}/milestones/${milestoneId}`, { status });
    return response.data;
  },

  getHealthSummary: async (projectId: string) => {
    const response = await axiosClient.get(`/projects/${projectId}/health-summary`);
    return response.data;
  },

  update: async (projectId: string, data: any) => {
    const response = await axiosClient.patch(`/projects/${projectId}`, data);
    return response.data;
  },

  delete: async (projectId: string) => {
    const response = await axiosClient.delete(`/projects/${projectId}`);
    return response.data;
  }
};
