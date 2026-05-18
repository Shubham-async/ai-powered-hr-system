import axiosClient from "./axiosClient";
import {
  CreateJDRequest,
  JobDescription,
  PostJDRequest,
  UpdateJDRequest,
} from "@/types/jd";

export const jdApi = {
  create: async (data: CreateJDRequest): Promise<JobDescription> => {
    const response = await axiosClient.post("/hiring/jd/generate", data);
    return response.data.data;
  },

  getAll: async (): Promise<JobDescription[]> => {
    const response = await axiosClient.get("/hiring/jd/all");
    return response.data.data;
  },

  getById: async (id: string): Promise<JobDescription> => {
    const response = await axiosClient.get(`/hiring/jd/${id}`);
    return response.data.data;
  },

  update: async (
    id: string,
    data: UpdateJDRequest
  ): Promise<JobDescription> => {
    const response = await axiosClient.patch(`/hiring/jd/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await axiosClient.delete(`/hiring/jd/${id}`);
  },

  createPost: async (id: string, data: PostJDRequest): Promise<void> => {
    await axiosClient.post(`/hiring/jd/${id}/post`, data); // Placeholder for future posting logic
  },
};
