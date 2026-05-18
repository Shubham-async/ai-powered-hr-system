import { useState,useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Users, Eye, CheckCircle, Filter, ExternalLink, Mail, Phone, Briefcase, Book, Code, Send } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader } from "@/components/shared/Loader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { resumeApi } from "@/api/resumeApi";
import { jdApi } from "@/api/jdApi";
import { assessmentApi } from "@/api/assessmentApi";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Candidate, ShortlistedCandidate } from "@/types/candidate";

type CandidateData = Candidate | ShortlistedCandidate;

export default function CandidateList() {
  const [selectedJD, setSelectedJD] = useState<string>("all");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState<ShortlistedCandidate['aiEvaluation'] | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [candidateType, setCandidateType] = useState<"applied" | "shortlisted">("applied");
  const [evaluationThreshold, setEvaluationThreshold] = useState<number>(0); // Threshold for showing shortlisted candidates
  const { data: jds } = useQuery({
    queryKey: ['jds'],
    queryFn: jdApi.getAll,
  });

  const { data: candidates, isLoading, error, refetch } = useQuery<CandidateData[]>({
    queryKey: ['candidates', selectedJD, candidateType],
    queryFn: async () => {
      const jdIdParam = selectedJD === "all" ? "all" : selectedJD;
      if (candidateType === "applied") {
        return resumeApi.getAllCandidates(jdIdParam);
      } else {
        return resumeApi.getShortlistedCandidates(jdIdParam);
      }
    },
  });

  const shortlistMutation = useMutation({
    mutationFn: resumeApi.shortlist,
    onSuccess: () => {
      toast.success("Candidates shortlisting started");
      refetch();
    },
    onError: () => {
      toast.error("Failed to shortlist candidates");
    },
  });

  const [taskStatus, setTaskStatus] = useState<{ progress: number; message: string; status: string } | null>(null);

  // Polling for background task status
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (shortlistMutation.isPending || (taskStatus && taskStatus.progress < 100 && taskStatus.status !== 'error')) {
      interval = setInterval(async () => {
        if (selectedJD && selectedJD !== "all") {
          try {
            const status = await resumeApi.getStatus(selectedJD);
            setTaskStatus(status);
            if (status.progress === 100) {
              clearInterval(interval);
              refetch();
              setTimeout(() => setTaskStatus(null), 5000); // Clear after 5s
            }
          } catch (err) {
            console.error("Status polling error:", err);
          }
        }
      }, 2000);
    }

    return () => clearInterval(interval);
  }, [shortlistMutation.isPending, taskStatus, selectedJD, refetch]);

  const initAssessmentMutation = useMutation({
    mutationFn: async (candidates: ShortlistedCandidate[]) => {
      const selectedJdData = jds?.find((jd) => jd._id === selectedJD);
      if (!selectedJdData) throw new Error("Job description not found");

      const results = await Promise.allSettled(
        candidates.map((candidate) =>
          assessmentApi.init({
            candidate_id: candidate.candidateId._id,
            job_id: selectedJD,
            role: selectedJdData.aiResponse.jobTitle,
            skills: selectedJdData.aiResponse.skills,
            test_type: "MCQ",
          })
        )
      );
      return results;
    },
    onSuccess: (results) => {
      const successful = results.filter((r) => r.status === "fulfilled").length;
      refetch();
      toast.success(`Assessment initialized for ${successful} candidates`);
    },
  });

  const handleShortlist = () => {
    if (selectedJD && selectedJD !== "all") {
      setTaskStatus({ progress: 1, message: "Initiating Screening...", status: "processing" });
      shortlistMutation.mutate({ jdId: selectedJD });
    } else {
      toast.error("Please select a job description");
    }
  };

  const handleSendAssessments = () => {
    if (candidateType !== "shortlisted") return toast.error("Switch to Shortlisted tab");
    if (processedCandidates.length === 0) return toast.error("No candidates found");
    initAssessmentMutation.mutate(processedCandidates as ShortlistedCandidate[]);
  };

  const handleViewProfile = (candidate: CandidateData) => {
    let candidateToView: Candidate | null = null;
    let evaluation: ShortlistedCandidate['aiEvaluation'] | null = null;

    if ('resume' in candidate) {
      candidateToView = candidate as Candidate;
    } else {
      const shortlisted = candidate as ShortlistedCandidate;
      evaluation = shortlisted.aiEvaluation || null;
      if (shortlisted.candidateId && 'resume' in shortlisted.candidateId) {
        candidateToView = shortlisted.candidateId;
      }
    }

    if (candidateToView) {
      setSelectedCandidate(candidateToView);
      setSelectedEvaluation(evaluation);
      setIsProfileOpen(true);
    }
  };

  useEffect(() => {
    if (selectedJD === "all" && candidateType === "shortlisted") {
      setCandidateType("applied");
    }
  }, [selectedJD, candidateType]);

  // Filter and sort candidates
  const processedCandidates = candidates
    ? candidateType === "shortlisted"
      ? (candidates as ShortlistedCandidate[])
        .filter((c) => c.aiEvaluation?.score && c.aiEvaluation.score >= evaluationThreshold)
        .sort((a, b) => (b.aiEvaluation?.score || 0) - (a.aiEvaluation?.score || 0))
      : candidates
    : [];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      new: { className: "bg-blue-100 text-blue-800", label: "New" },
      assessment: { className: "bg-purple-100 text-purple-800", label: "Assessment" },
      shortlisted: { className: "bg-green-100 text-green-800", label: "Shortlisted" },
    };
    const config = variants[status] || variants.new;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (isLoading) return <Loader size="lg" text="Loading candidates..." />;
  if (error) return <ErrorState message="Failed to load candidates" retry={refetch} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidate Screening"
        description="Run AI shortlisting and manage assessments"
        actions={
          <div className="flex gap-2">
            <Select value={selectedJD} onValueChange={setSelectedJD}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Filter by Job" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                {jds?.map((jd) => (!jd.aiResponse ? null : (
                  <SelectItem key={jd._id} value={jd._id}>
                    {jd.aiResponse.jobTitle}
                  </SelectItem>
                )))}
              </SelectContent>
            </Select>
            <Button onClick={handleShortlist} disabled={selectedJD === "all" || shortlistMutation.isPending}>
              <CheckCircle className="h-4 w-4 mr-2" />
              {shortlistMutation.isPending ? "Starting AI..." : "Run AI Shortlist"}
            </Button>
          </div>
        }
      />

      {/* 🚀 AI Progress Bar 🚀 */}
      {taskStatus && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span className="flex items-center gap-2">
                  <Loader size="sm" className="animate-spin text-primary" />
                  {taskStatus.message}
                </span>
                <span>{taskStatus.progress}%</span>
              </div>
              <Progress value={taskStatus.progress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button
          variant={candidateType === "applied" ? "default" : "outline"}
          onClick={() => setCandidateType("applied")}
        >
          Applied Candidates
        </Button>
        {selectedJD !== "all" && (
          <Button
            variant={candidateType === "shortlisted" ? "default" : "outline"}
            onClick={() => setCandidateType("shortlisted")}
          >
            Shortlisted Candidates
          </Button>
        )}
        {candidateType === "shortlisted" && processedCandidates.length > 0 && selectedJD !== "all" && (
          <Button
            onClick={handleSendAssessments}
            disabled={initAssessmentMutation.isPending}
            className="ml-auto bg-green-600 hover:bg-green-700"
          >
            <Send className="h-4 w-4 mr-2" />
            {initAssessmentMutation.isPending
              ? "Sending Assessments..."
              : `Send Assessments (${processedCandidates.length})`}
          </Button>
        )}
      </div>

      {!processedCandidates || processedCandidates.length === 0 ? (
        <EmptyState
          icon={Users}
          title={
            candidateType === "applied"
              ? "No candidates yet"
              : "No high-scoring candidates"
          }
          description={
            candidateType === "applied"
              ? "Candidates who apply to your job postings will appear here"
              : "Candidates with AI evaluation score ≥ 70% will appear here"
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>{candidateType === "applied" ? "Skills" : "Match Score"}</TableHead>
                  <TableHead>{candidateType === "applied" ? "Experience" : "Matched Skills"}</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedCandidates?.map((candidate) => {
                  const isApplied = 'resume' in candidate;
                  const shortlistedCandidate = isApplied ? null : (candidate as ShortlistedCandidate);
                  const candidateData = isApplied ? (candidate as Candidate) : (candidate as ShortlistedCandidate).candidateId;

                  return (
                    <TableRow key={candidate._id}>
                      <TableCell className="font-medium">{candidateData.name}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <a href={`mailto:${candidateData.email}`} className="text-blue-600 hover:underline">
                              {candidateData.email}
                            </a>
                          </div>
                          {candidateData.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <a href={`tel:${candidateData.phone}`} className="text-muted-foreground">
                                {candidateData.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {isApplied ? (
                          <>
                            {candidateData.skills && candidateData.skills.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                            {(candidateData.skills || []).slice(0, 3).map((skill, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                                {(candidateData.skills || []).length > 3 && (
                                  <Badge variant="outline" className="text-xs bg-muted">
                                    +{(candidateData.skills || []).length - 3}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </>
                        ) : (
                          <>
                            {shortlistedCandidate?.aiEvaluation?.score !== undefined ? (
                              <div className="flex items-center gap-2">
                                <Progress value={shortlistedCandidate.aiEvaluation.score} className="w-16 h-2" />
                                <span className="text-sm font-medium">{shortlistedCandidate.aiEvaluation.score}%</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Not scored</span>
                            )}
                          </>
                        )}
                      </TableCell>
                      <TableCell>
                        {isApplied ? (
                          <>
                            {candidateData.experience && candidateData.experience.length > 0 ? (
                              <div className="text-sm">
                                <div className="font-medium">{candidateData.experience[0].role}</div>
                                <div className="text-xs text-muted-foreground">{candidateData.experience[0].company}</div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Fresher</span>
                            )}
                          </>
                        ) : (
                          <>
                            {shortlistedCandidate?.aiEvaluation?.recommendation && (
                              <Badge variant="outline" className="text-xs">
                                {shortlistedCandidate.aiEvaluation.recommendation}
                              </Badge>
                            )}
                          </>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(candidateData.status || "new")}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(candidateData.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewProfile(candidate)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Profile
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Candidate Profile Dialog */}
      {selectedCandidate && (
        <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedCandidate.name}</DialogTitle>
              <DialogDescription>
                Applied on {new Date(selectedCandidate.createdAt).toLocaleDateString()}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* AI Evaluation Section */}
              {selectedEvaluation && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <h3 className="font-bold text-primary">AI Evaluation</h3>
                    </div>
                    <Badge variant="outline" className="bg-white border-primary/30">
                      Score: {selectedEvaluation.score}%
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recommendation:</span>
                    <Badge className="bg-primary text-primary-foreground">{selectedEvaluation.recommendation}</Badge>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reasoning:</span>
                    <p className="text-sm leading-relaxed text-foreground bg-white/50 p-3 rounded border border-primary/10 italic">
                      "{selectedEvaluation.reasoning}"
                    </p>
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div className="grid grid-cols-2 gap-4 border-b pb-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Email</div>
                  <a href={`mailto:${selectedCandidate.email}`} className="text-blue-600 hover:underline">
                    {selectedCandidate.email}
                  </a>
                </div>
                {selectedCandidate.phone && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Phone</div>
                    <a href={`tel:${selectedCandidate.phone}`} className="text-blue-600 hover:underline">
                      {selectedCandidate.phone}
                    </a>
                  </div>
                )}
                {selectedCandidate.resume && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Resume</div>
                    <a
                      href={selectedCandidate.resume}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      View Resume
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Skills */}
              {selectedCandidate.skills && selectedCandidate.skills.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Code className="h-4 w-4" />
                    <h3 className="font-semibold">Skills</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(selectedCandidate.skills || []).map((skill, idx) => (
                      <Badge key={idx} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {selectedCandidate.experience && selectedCandidate.experience.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="h-4 w-4" />
                    <h3 className="font-semibold">Experience</h3>
                  </div>
                  <div className="space-y-3">
                    {(selectedCandidate.experience || []).map((exp, idx) => (
                      <div key={idx} className="border-l-2 border-primary pl-4">
                        <div className="font-medium">{exp.role}</div>
                        <div className="text-sm text-muted-foreground">{exp.company}</div>
                        {exp.duration && <div className="text-xs text-muted-foreground mt-1">{exp.duration}</div>}
                        {exp.description && <p className="text-sm mt-2">{exp.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {selectedCandidate.education && selectedCandidate.education.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Book className="h-4 w-4" />
                    <h3 className="font-semibold">Education</h3>
                  </div>
                  <div className="space-y-3">
                    {(selectedCandidate.education || []).map((edu, idx) => (
                      <div key={idx} className="border-l-2 border-blue-500 pl-4">
                        <div className="font-medium">{edu.degree} in {edu.fieldOfStudy}</div>
                        <div className="text-sm text-muted-foreground">{edu.institution}</div>
                        {edu.endDate && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Graduation: {new Date(edu.endDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {selectedCandidate.projects && selectedCandidate.projects.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Projects</h3>
                  <div className="space-y-3">
                    {selectedCandidate.projects.map((project, idx) => (
                      <div key={idx} className="border rounded-lg p-3 bg-muted/50">
                        <div className="flex justify-between items-start">
                          <div className="font-medium">{project.name}</div>
                          {project.link && (
                            <a
                              href={project.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-xs"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                        {(project.technologies || []).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(project.technologies || []).map((tech, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {tech}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interests */}
              {selectedCandidate.interests && selectedCandidate.interests.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.interests.map((interest, idx) => (
                      <Badge key={idx} variant="outline">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              {selectedCandidate.summary && (
                <div>
                  <h3 className="font-semibold mb-2">Professional Summary</h3>
                  <p className="text-sm text-muted-foreground">{selectedCandidate.summary}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
