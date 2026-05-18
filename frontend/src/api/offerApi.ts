import axiosClient from './axiosClient';
import { CreateOfferRequest, CreateOnboardingTaskRequest, Offer, OnboardingTask } from '@/types/offer';

export const offerApi = {
  create: async (data: CreateOfferRequest): Promise<{ success: boolean; message: string; offer: Offer }> => {
    const response = await axiosClient.post('/hiring/offers/create', data);
    return response.data;
  },

  reject: async (data: { candidate_id: string; job_id: string }): Promise<{ success: boolean; message: string }> => {
    const response = await axiosClient.post('/hiring/offers/reject', data);
    return response.data;
  },

  list: async (): Promise<{ success: boolean; offers: Offer[] }> => {
    const response = await axiosClient.get('/hiring/offers/list');
    return response.data;
  },

  getById: async (id: string): Promise<{ success: boolean; offer: Offer }> => {
    const response = await axiosClient.get(`/hiring/offers/list`); // List all or filter by ID if needed
    // NOTE: If backend has a specific getById, use: /hiring/offers/${id}
    return response.data;
  },

  updateStatus: async (id: string, status: string): Promise<{ success: boolean; message: string; offer: Offer }> => {
    const response = await axiosClient.put(`/hiring/offers/status/${id}`, { status });
    return response.data;
  },

  resend: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await axiosClient.post(`/hiring/offers/resend/${id}`);
    return response.data;
  },

  createOnboardingTask: async (data: CreateOnboardingTaskRequest): Promise<{ success: boolean; message: string; task: OnboardingTask }> => {
    const response = await axiosClient.post('/hiring/offers/onboarding/create', data);
    return response.data;
  },

  getOnboardingTasks: async (candidate_id: string): Promise<{ success: boolean; tasks: OnboardingTask[] }> => {
    const response = await axiosClient.get(`/hiring/offers/onboarding/${candidate_id}`);
    return response.data;
  },
};
