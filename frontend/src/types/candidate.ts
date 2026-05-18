export interface Candidate {
  _id: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  resume: string; // URL
  skills: string[];
  summary?: string;
  experience?: Array<{
    company: string;
    role: string;
    duration: string;
    description: string;
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startDate?: string;
    endDate?: string;
  }>;
  projects?: Array<{
    name: string;
    description: string;
    technologies: string[];
    link: string;
  }>;
  interests?: string[];
  job_id: string;
  createdAt: string;
  updatedAt: string;
  // For shortlisted candidates
  matchScore?: number;
  matchedSkills?: string[];
  status?: 'new' | 'screening' | 'shortlisted' | 'assessment' | 'interview' | 'offer' | 'rejected' | 'hired';
}

export interface ShortlistRequest {
  jdId: string;
}

export interface ShortlistedCandidate {
  _id: string;
  candidateId: Candidate;
  jobId: string;
  matchScore?: number;
  skillsMatch?: {
    required: string[];
    matched: string[];
    matchPercentage: number;
  };
  status: string;
  loginId: string;
  password?: string;
  email: string;
  name: string;
  createdAt: string;
  shortlistedAt: string;
  aiEvaluation?: {
    score: number;
    confidence: number;
    recommendation: string;
    reasoning: string;
    evaluatedAt: string;
  };
}

export interface CandidateFilters {
  jdId?: string;
  status?: string;
  minMatchScore?: number;
}
