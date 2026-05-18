import { useQuery } from "@tanstack/react-query";
import { Calendar, Video, MapPin, User, Clock, CheckCircle, XCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader } from "@/components/shared/Loader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { interviewApi } from "@/api/interviewApi";
import { format } from "date-fns";

export default function InterviewList() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['interviews'],
    queryFn: () => interviewApi.list({ role: 'hr' }), // Passing a default role for list
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      scheduled: { variant: "secondary", label: "Scheduled" },
      completed: { variant: "default", label: "Completed" },
      cancelled: { variant: "destructive", label: "Cancelled" },
      rescheduled: { variant: "outline", label: "Rescheduled" },
      no_show: { variant: "destructive", label: "No Show" },
    };
    const config = variants[status] || { variant: "outline", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) return <Loader size="lg" text="Loading interviews..." />;
  if (error) return <ErrorState message="Failed to load interviews" retry={refetch} />;

  const interviews = data?.interviews || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Interviews"
        description="Manage and track candidate interview schedules"
      />

      {interviews.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No interviews scheduled"
          description="Candidates who are scheduled for interviews will appear here."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Mode/Link</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Interviewers</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {interviews.map((interview: any) => (
                  <TableRow key={interview._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{interview.candidate_id?.name || interview.candidate_id || "Unknown"}</span>
                      </div>
                      <div className="text-xs text-muted-foreground ml-6">
                        {interview.job_id?.aiResponse?.jobTitle || "Position TBD"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <Clock className="h-3 w-3" />
                          {interview.scheduled_time ? format(new Date(interview.scheduled_time), "MMM d, yyyy") : "N/A"}
                        </div>
                        <div className="text-xs text-muted-foreground ml-4">
                          {interview.scheduled_time ? format(new Date(interview.scheduled_time), "h:mm a") : ""}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {interview.mode === 'online' ? (
                          <div className="flex items-center gap-1 text-blue-600">
                            <Video className="h-3 w-3" />
                            <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer" className="text-xs hover:underline">
                              Join Meeting
                            </a>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-amber-600">
                            <MapPin className="h-3 w-3" />
                            <span className="text-xs">On-site</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(interview.status)}</TableCell>
                    <TableCell>
                      <div className="flex -space-x-1 outline-none">
                        {(interview.interviewer_ids || []).map((id: string, idx: number) => (
                          <div key={idx} className="h-6 w-6 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-[10px] font-bold text-primary">
                            {(id.toString().substring(0, 1)).toUpperCase()}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
