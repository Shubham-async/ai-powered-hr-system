import axiosClient from "./axiosClient";

export const leaveApi = {
  getAll: async () => {
    const response = await axiosClient.get("/leave/all");
    return response.data;
  },

  respond: async (leaveId: string, decision: string, hrEmployeeId: string, comment: string) => {
    const response = await axiosClient.patch(`/leave/${leaveId}/respond`, {
      decision,
      hrEmployeeId,
      comment
    });
    return response.data;
  },

  getStats: async () => {
    // We can infer stats from getAll or if there's a specific endpoint
    const response = await axiosClient.get("/leave/all");
    const all = response.data.data || [];
    return {
      total: all.length,
      pending: all.filter((l: any) => l.status === "Pending").length,
      approved: all.filter((l: any) => l.status === "Approved").length,
      rejected: all.filter((l: any) => l.status === "Rejected").length,
    };
  }
};
