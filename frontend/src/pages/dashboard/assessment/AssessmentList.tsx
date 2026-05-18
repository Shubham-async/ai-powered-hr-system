import { useQuery, useMutation } from "@tanstack/react-query";
import { ClipboardList, Plus, Calendar } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/shared/Loader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { assessmentApi } from "@/api/assessmentApi";
import { interviewApi } from "@/api/interviewApi";
import { authApi } from "@/api/authApi";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AssessmentList() {
  const navigate = useNavigate();
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [candidateToSchedule, setCandidateToSchedule] = useState<any>(null);
  const [scheduleForm, setScheduleForm] = useState({
    scheduled_time: "",
    round: "technical",
    mode: "online",
    interviewer_id: ""
  });

  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ['shortlisted-candidates'],
    queryFn: assessmentApi.getShortlisted,
  });
  const shortlisted = response?.shortlisted || [];

  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: authApi.getEmployees
  });
  const employees = employeesData?.users || [];

  const scheduleInterviewMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await interviewApi.create(payload);
      return response;
    },
    onSuccess: () => {
      toast.success("✅ Interview scheduled successfully!");
      setScheduleModalOpen(false);
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to schedule interview");
    }
  });

  const handleOpenScheduleModal = (candidate: any) => {
    setCandidateToSchedule(candidate);
    setScheduleModalOpen(true);
  };

  const submitSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateToSchedule) return;

    if (!scheduleForm.scheduled_time || !scheduleForm.interviewer_id) {
      toast.error("Please fill in the required fields (Time and Interviewer)");
      return;
    }

    const payload = {
      candidate_id: candidateToSchedule.candidate_id._id || candidateToSchedule.candidate_id,
      job_id: candidateToSchedule.job_id._id || candidateToSchedule.job_id,
      scheduled_time: scheduleForm.scheduled_time,
      round: scheduleForm.round,
      mode: scheduleForm.mode,
      interviewer_ids: [scheduleForm.interviewer_id]
    };

    scheduleInterviewMutation.mutate(payload);
  };

  if (isLoading) return <Loader size="lg" text="Loading assessments..." />;
  if (error) return <ErrorState message="Failed to load assessments" retry={refetch} />;
console.log("Shortlisted Candidates:", shortlisted);
  return (
    <div>
      <PageHeader
        title="Candidate Assessments"
        description="Monitor test performance and shortlist candidates"
      />

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{shortlisted?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">
              {shortlisted?.filter(c => c.ai_analysis?.final_recommendation === 'yes' || c.ai_analysis?.final_recommendation === 'strong_yes').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Below 70%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">
              {shortlisted?.filter(c => c.percentage && c.percentage < 70).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {!shortlisted || shortlisted.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No assessments yet"
          description="Shortlisted candidates will be sent assessment tests automatically"
        />
      ) : (
        <div className="grid gap-4">
          {shortlisted.map((candidate) => (
            <Card key={candidate._id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{candidate.candidate_id?.name || "Candidate"}</h3>
                      <Badge variant={candidate.percentage >= 70 ? 'default' : 'secondary'}>
                        {candidate.ai_analysis?.final_recommendation || 'pending'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{candidate.candidate_id?.email}</p>

                    {candidate.percentage !== undefined && (
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-sm text-muted-foreground">Test Score:</span>
                          <span className="ml-2 font-semibold text-lg">{candidate.percentage}%</span>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Total Score:</span>
                          <span className="ml-2 font-semibold text-lg">{candidate.total_score}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/dashboard/assessment/${candidate._id}`)}
                    >
                      View Details
                    </Button>
                    <Button
                      onClick={() => handleOpenScheduleModal(candidate)}
                      className="gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      Schedule
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
            <DialogDescription>Assign an interviewer and set the schedule for {candidateToSchedule?.candidate_id?.name}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitSchedule} className="space-y-4">
            <div className="space-y-2">
              <Label>Interview Time</Label>
              <Input 
                type="datetime-local" 
                value={scheduleForm.scheduled_time}
                onChange={e => setScheduleForm(prev => ({ ...prev, scheduled_time: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Round</Label>
              <select 
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={scheduleForm.round}
                onChange={e => setScheduleForm(prev => ({ ...prev, round: e.target.value }))}
              >
                <option value="technical">Technical</option>
                <option value="hr">HR</option>
                <option value="managerial">Managerial</option>
                <option value="final">Final</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Mode</Label>
              <select 
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={scheduleForm.mode}
                onChange={e => setScheduleForm(prev => ({ ...prev, mode: e.target.value }))}
              >
                <option value="online">Online</option>
                <option value="onsite">On-Site</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Assign Interviewer</Label>
              <select 
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={scheduleForm.interviewer_id}
                onChange={e => setScheduleForm(prev => ({ ...prev, interviewer_id: e.target.value }))}
                required
              >
                <option value="" disabled>Select an employee</option>
                {employees.map((emp: any) => (
                  <option key={emp._id} value={emp._id}>{emp.name || emp.email} ({emp.role})</option>
                ))}
              </select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setScheduleModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={scheduleInterviewMutation.isPending}>
                {scheduleInterviewMutation.isPending ? "Scheduling..." : "Confirm Schedule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
