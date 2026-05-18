export interface Question {
  question_id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  selected_answer?: string;
  is_correct?: boolean;
  marks: number;
}

export interface Assessment {
  _id: string;
  candidate_id: string;
  job_id: string;
  questions: Question[];
  test_status: 'pending' | 'in_progress' | 'completed' | 'evaluated';
  total_marks: number;
  test_type: string;
  started_at?: string;
  completed_at?: string;
  duration_minutes?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AssessmentInit {
  candidate_id: string;
  job_id: string;
  role: string;
  skills: string[];
  test_type?: 'MCQ' | 'Coding' | 'Aptitude' | 'Communication' | 'Custom';
}

export interface SubmitAssessmentRequest {
  test_id: string;
  responses: {
    question_id: string;
    answer: string;
  }[];
}

export interface CandidateScore {
  _id: string;
  candidate_id: string;
  job_id: string;
  test_id: string;
  total_score: number;
  percentage: number;
  ai_analysis?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShortlistedCandidate {
  _id: string;
  candidate_id: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    skills?: string[];
    summary?: string;
    experience?: {
      company: string;
      role: string;
      duration: string;
      description?: string;
    }[];
    education?: {
      school: string;
      degree: string;
      field: string;
      year?: string;
    }[];
  };
  job_id?: {
    _id: string;
    title: string;
  };
  test_id?: string;
  total_score: number;
  percentage: number;
  passing_score?: number;
  section_scores?: {
    section_name: string;
    max_marks: number;
    obtained_marks: number;
    ai_score_adjustment?: number;
  }[];
  ai_analysis?: {
    confidence_score?: number;
    communication_score?: number;
    coding_efficiency?: number;
    final_recommendation?: 'strong_yes' | 'yes' | 'neutral' | 'no' | 'strong_no';
  };
  createdAt?: string;
  updatedAt?: string;
}
