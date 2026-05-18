import axiosClient from "./axiosClient";
import {
  Candidate,
  ShortlistRequest,
  ShortlistedCandidate,
} from "@/types/candidate";

export const resumeApi = {
  shortlist: async (data: ShortlistRequest): Promise<void> => {
    const response = await axiosClient.post("/hiring/shortlist", data);
    return response.data;
  },

  getAllCandidates: async (jdId?: string): Promise<Candidate[]> => {
    const url = jdId ? `/hiring/getAllCandidates/${jdId}` : "/hiring/getAllCandidates/all";
    const response = await axiosClient.get(url);
    return response.data.data;
  },

  getShortlistedCandidates: async (
    jdId?: string
  ): Promise<ShortlistedCandidate[]> => {
    const url = jdId
      ? `/hiring/getAllShortListedCandidates/${jdId}`
      : "/hiring/getAllShortListedCandidates/all";
    const response = await axiosClient.get(url);
    return response.data.data;
  },

  getStatus: async (jobId: string): Promise<{ progress: number; message: string; status: string }> => {
    const response = await axiosClient.get(`/hiring/status/${jobId}`);
    return response.data;
  },
};
