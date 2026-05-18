export interface Interview {
  _id: string;
  id?: string;
  candidate_id: string;
  job_id: string;
  interviewer_ids: string[];
  round?: 'technical' | 'hr' | 'managerial' | 'final';
  scheduled_time?: string;
  duration_minutes?: number;
  mode: 'online' | 'onsite';
  meeting_link?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show';
  feedback?: {
    interviewer_id: string;
    comments: string;
    rating: number; // 1-5
    recommendation: 'strong_yes' | 'yes' | 'neutral' | 'no' | 'strong_no';
  };
  created_at?: string;
  updated_at?: string;
}

export interface CreateInterviewRequest {
  candidate_id: string;
  job_id: string;
  interviewer_ids: string[];
  mode: 'online' | 'onsite';
  scheduled_time?: string;
  duration_minutes?: number;
  meeting_link?: string;
}

export interface UpdateInterviewStatusRequest {
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show';
}

export interface SubmitFeedbackRequest {
  feedback: string;
  rating: number; // 1-5
}
