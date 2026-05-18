export interface JobDescription {
  _id: string;
  id?: string;
  userId: string;
  prompt: string;
  aiResponse: {
    jobTitle: string;
    company: string;
    location: string;
    employmentType: string;
    skills: string[];
    experience: string;
    salaryRange: string;
    aiMetadata: {
      shortSummary: string;
      highlights: string[];
      hashtags: string[];
    };
  };
  status: 'queued' | 'processing' | 'completed' | 'failed';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  platformPosts?: Array<{
    platform: string;
    success: boolean;
    message: string;
    status: string;
    postedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJDRequest {
  prompt: string;
}

export interface UpdateJDRequest {
  title?: string;
  description?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
}

export interface PostJDRequest {
  platforms: string[];
}
