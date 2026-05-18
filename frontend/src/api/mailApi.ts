import axiosClient from "./axiosClient";

export const mailApi = {
  getAll: async (params?: { module?: string; status?: string; page?: number; limit?: number }) => {
    const response = await axiosClient.get("/mail/all", { params });
    return response.data;
  },

  send: async (data: { to: string; subject: string; body: string; toEmployeeId?: string; relatedModule?: string; isHtml?: boolean }) => {
    const response = await axiosClient.post("/mail/send", data);
    return response.data;
  }
};
