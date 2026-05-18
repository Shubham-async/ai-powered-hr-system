import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, Mail } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/shared/Loader";
import { ErrorState } from "@/components/shared/ErrorState";
import { assessmentApi } from "@/api/assessmentApi";

export default function AssessmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ['assessment-detail', id],
    queryFn: () => assessmentApi.getAssessmentDetails(id!),
    enabled: !!id,
  });

  const candidate = response?.shortlisted;

  if (!id) {
    return (
      <ErrorState 
        message="No assessment ID provided" 
        retry={() => navigate(-1)} 
      />
    );
  }

  if (isLoading) return <Loader size="lg" text="Loading assessment details..." />;
  if (error) {
    console.error("Assessment fetch error:", error);
    return <ErrorState message="Failed to load assessment details" retry={refetch} />;
  }
  if (!candidate) {
    console.warn("No candidate data found for ID:", id);
    return <ErrorState message="Assessment not found" retry={() => navigate(-1)} />;
  }

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'strong_yes':
        return 'bg-green-100 text-green-800';
      case 'yes':
        return 'bg-emerald-100 text-emerald-800';
      case 'neutral':
        return 'bg-yellow-100 text-yellow-800';
      case 'no':
        return 'bg-orange-100 text-orange-800';
      case 'strong_no':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const downloadReport = () => {
    // Generate and download assessment report
    const reportContent = `
ASSESSMENT REPORT
================

Candidate: ${candidate.candidate_id?.name || 'N/A'}
Email: ${candidate.candidate_id?.email || 'N/A'}
Phone: ${candidate.candidate_id?.phone || 'N/A'}

ASSESSMENT SCORES
=================
Total Score: ${candidate.total_score || 0}
Percentage: ${candidate.percentage?.toFixed(2) || 0}%
Passing Score: ${candidate.passing_score || 80}

AI ANALYSIS
===========
Final Recommendation: ${candidate.ai_analysis?.final_recommendation || 'N/A'}
Confidence Score: ${((candidate.ai_analysis?.confidence_score || 0) * 100).toFixed(2)}%
Communication Score: ${((candidate.ai_analysis?.communication_score || 0) * 100).toFixed(2)}%
Coding Efficiency: ${((candidate.ai_analysis?.coding_efficiency || 0) * 100).toFixed(2)}%

CANDIDATE DETAILS
=================
Skills: ${candidate.candidate_id?.skills?.join(', ') || 'N/A'}
Experience: ${candidate.candidate_id?.experience?.length || 0} positions
Education: ${candidate.candidate_id?.education?.length || 0} qualifications

Generated: ${new Date().toLocaleString()}
    `.trim();

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(reportContent));
    element.setAttribute('download', `assessment_${candidate.candidate_id?.name || 'candidate'}_${new Date().getTime()}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={candidate.candidate_id?.name || 'Assessment Detail'}
          description={candidate.candidate_id?.email || ''}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        {/* Score Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Test Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{candidate.percentage?.toFixed(2) || 0}%</div>
            <p className="text-xs text-muted-foreground mt-2">
              Total: {candidate.total_score || 0} / {candidate.passing_score || 80}
            </p>
          </CardContent>
        </Card>

        {/* Recommendation Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recommendation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={`text-lg py-1 px-3 ${getRecommendationColor(candidate.ai_analysis?.final_recommendation || 'neutral')}`}>
              {(candidate.ai_analysis?.final_recommendation || 'pending')?.replace('_', ' ').toUpperCase()}
            </Badge>
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {candidate.percentage! >= candidate.passing_score! ? (
                <span className="text-green-600">Passed</span>
              ) : (
                <span className="text-red-600">Failed</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>AI Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Confidence Score</p>
              <p className="text-2xl font-bold">
                {((candidate.ai_analysis?.confidence_score || 0) * 100).toFixed(2)}%
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Communication Score</p>
              <p className="text-2xl font-bold">
                {((candidate.ai_analysis?.communication_score || 0) * 100).toFixed(2)}%
              </p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Coding Efficiency</p>
              <p className="text-2xl font-bold">
                {((candidate.ai_analysis?.coding_efficiency || 0) * 100).toFixed(2)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Candidate Details Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Candidate Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Full Name</p>
              <p className="text-lg font-semibold">{candidate.candidate_id?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Email</p>
              <p className="text-lg font-semibold">{candidate.candidate_id?.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Phone</p>
              <p className="text-lg font-semibold">{candidate.candidate_id?.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Skills</p>
              <div className="flex flex-wrap gap-2">
                {candidate.candidate_id?.skills?.map((skill) => (
                  <Badge key={skill} variant="secondary">{skill}</Badge>
                )) || <span>N/A</span>}
              </div>
            </div>
          </div>

          {candidate.candidate_id?.summary && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Summary</p>
              <p className="text-sm leading-relaxed">{candidate.candidate_id.summary}</p>
            </div>
          )}

          {candidate.candidate_id?.experience && candidate.candidate_id.experience.length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-3">Experience</p>
              <div className="space-y-3">
                {candidate.candidate_id.experience.map((exp: any, idx: number) => (
                  <div key={idx} className="border-l-2 border-gray-200 pl-4 pb-3">
                    <p className="font-semibold">{exp.role}</p>
                    <p className="text-sm text-muted-foreground">{exp.company}</p>
                    <p className="text-xs text-muted-foreground">{exp.duration}</p>
                    {exp.description && (
                      <p className="text-sm mt-1">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Score Breakdown Section */}
      {candidate.section_scores && candidate.section_scores.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Section Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {candidate.section_scores.map((section: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-semibold">{section.section_name || `Section ${idx + 1}`}</p>
                    <p className="text-sm text-muted-foreground">
                      {section.obtained_marks} / {section.max_marks} marks
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      {section.max_marks ? ((section.obtained_marks / section.max_marks) * 100).toFixed(2) : 0}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <Button onClick={downloadReport} className="gap-2">
          <Download className="h-4 w-4" />
          Download Report
        </Button>
        <Button variant="outline" className="gap-2">
          <Mail className="h-4 w-4" />
          Send Feedback
        </Button>
      </div>
    </div>
  );
}
