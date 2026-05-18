import axiosClient from "./axiosClient";
import {
  CreateInterviewRequest,
  Interview,
  SubmitFeedbackRequest,
  UpdateInterviewStatusRequest,
} from "@/types/interview";

export const interviewApi = {
  create: async (
    data: CreateInterviewRequest
  ): Promise<{ success: boolean; message: string; interview: Interview }> => {
    const response = await axiosClient.post("/hiring/interviews/schedule", data);
    return response.data;
  },

  list: async (p0: { status?: string; role: string; }): Promise<{ success: boolean; interviews: Interview[] }> => {
    const response = await axiosClient.get("/hiring/interviews/all/all");
    return { success: true, interviews: response.data.data };
  },

  updateStatus: async (
    id: string,
    data: UpdateInterviewStatusRequest
  ): Promise<{ success: boolean; message: string; interview: Interview }> => {
    const response = await axiosClient.put(`/hiring/interviews/status/${id}`, data);
    return response.data;
  },

  submitFeedback: async (
    id: string,
    data: SubmitFeedbackRequest
  ): Promise<{ success: boolean; message: string; interview: Interview }> => {
    const response = await axiosClient.post(`/hiring/interviews/feedback/${id}`, data);
    return response.data;
  },
};
