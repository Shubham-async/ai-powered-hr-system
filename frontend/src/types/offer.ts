export interface Offer {
  _id: string;
  id?: string;
  candidate_id: string;
  job_id: string;
  offer_letter_text: string;
  salary_offered: {
    amount: number;
    currency: string;
    benchmark_position?: number;
  };
  status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'accepted' | 'rejected';
  signature_link?: string;
  sent_at?: string;
  accepted_at?: string;
  rejected_at?: string;
  approval_chain?: Array<{
    approver_id: string;
    level: number;
    status: 'pending' | 'approved' | 'rejected';
    acted_at?: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOfferRequest {
  candidate_id: string;
  job_id: string;
  baseSalary: number;
  positionTitle: string;
  candidate_email: string;
}

export interface OnboardingTask {
  _id: string;
  id?: string;
  candidate_id: string;
  offer_id: string;
  task_title: string;
  task_description: string;
  due_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOnboardingTaskRequest {
  candidate_id: string;
  offer_id: string;
  task_title: string;
  task_description: string;
  due_date: string;
}
