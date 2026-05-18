import axiosClient from './axiosClient';
import { Assessment, AssessmentInit, CandidateScore, ShortlistedCandidate, SubmitAssessmentRequest } from '@/types/assessment';

export const assessmentApi = {
  init: async (data: AssessmentInit): Promise<{ success: boolean; message: string; test_id: string; status: string }> => {
    const response = await axiosClient.post('/hiring/assessments/init', data);
    return response.data;
  },

  getTest: async (candidate_id: string): Promise<{ success: boolean; test: Assessment }> => {
    const response = await axiosClient.get('/hiring/assessments/test', { params: { candidate_id } });
    return response.data;
  },

  getMyTests: async (): Promise<{ success: boolean; count: number; tests: Assessment[] }> => {
    const response = await axiosClient.get('/hiring/assessments/my-tests');
    return response.data;
  },

  getTestByTestId: async (test_id: string): Promise<{ success: boolean; test: Assessment }> => {
    const response = await axiosClient.get(`/hiring/assessments/test/${test_id}`);
    return response.data;
  },

  submit: async (data: SubmitAssessmentRequest): Promise<{ success: boolean; message: string; score: CandidateScore }> => {
    const response = await axiosClient.post('/hiring/assessments/submit', data);
    return response.data;
  },

  getShortlisted: async (): Promise<{ success: boolean; total: number; shortlisted: ShortlistedCandidate[] }> => {
    const response = await axiosClient.get('/hiring/assessments/shortlisted');
    return response.data;
  },

  getAssessmentDetails: async (candidateScoreId: string): Promise<{ success: boolean; shortlisted: ShortlistedCandidate }> => {
    const response = await axiosClient.get(`/hiring/assessments/shortlisted/${candidateScoreId}`);
    return response.data;
  },
};
