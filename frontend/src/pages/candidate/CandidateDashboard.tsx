import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Calendar, Gift, Briefcase } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { CardStats } from "@/components/shared/CardStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { assessmentApi } from "@/api/assessmentApi";

export default function CandidateDashboard() {
  const navigate = useNavigate();

  const { data: myData, isLoading } = useQuery({
    queryKey: ['myTests'],
    queryFn: assessmentApi.getMyTests
  });

  const tests = myData?.tests || [];
  const pendingTests = tests.filter(t => t.test_status === 'pending');

  return (
    <div>
      <PageHeader
        title="My Dashboard"
        description="Track your application progress"
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <CardStats
          title="Tests Assigned"
          value={tests.length}
          icon={ClipboardList}
          description={`${pendingTests.length} pending`}
        />
        <CardStats
          title="Upcoming Interviews"
          value="0"
          icon={Calendar}
          description="This week"
        />
        <CardStats
          title="Offers"
          value="0"
          icon={Gift}
          description="Pending response"
        />
        <CardStats
          title="Onboarding Tasks"
          value="0"
          icon={Briefcase}
          description="Not started"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pending Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <p className="text-sm text-muted-foreground p-4">Loading your assessments...</p>
              ) : pendingTests.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4">No pending actions right now.</p>
              ) : (
                pendingTests.map(test => (
                  <div key={test._id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">Technical Assessment</p>
                        <Badge className="bg-warning text-warning-foreground text-xs">Pending</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Complete your technical test for the role
                      </p>
                      <p className="text-xs text-info mt-1">Due: As soon as possible</p>
                    </div>
                    <Button size="sm" onClick={() => navigate(`/candidate/tests/${test._id}`)}>
                      Start Test
                    </Button>
                  </div>
                ))
              )}

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">Offer Response</p>
                    <Badge className="bg-info text-info-foreground">Action Required</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Review and respond to job offer
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Expires in 5 days</p>
                </div>
                <Button size="sm" onClick={() => navigate('/candidate/offers')}>
                  View Offer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Application Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="rounded-full bg-success p-2">
                    <div className="h-2 w-2 rounded-full bg-success-foreground" />
                  </div>
                  <div className="h-full w-px bg-border mt-2" />
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-medium text-sm">Application Submitted</p>
                  <p className="text-xs text-muted-foreground">2 weeks ago</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="rounded-full bg-success p-2">
                    <div className="h-2 w-2 rounded-full bg-success-foreground" />
                  </div>
                  <div className="h-full w-px bg-border mt-2" />
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-medium text-sm">Resume Shortlisted</p>
                  <p className="text-xs text-muted-foreground">1 week ago</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="rounded-full bg-warning p-2">
                    <div className="h-2 w-2 rounded-full bg-warning-foreground" />
                  </div>
                  <div className="h-full w-px bg-border mt-2" />
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-medium text-sm">Assessment Pending</p>
                  <p className="text-xs text-muted-foreground">Now</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="rounded-full bg-muted p-2">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-muted-foreground">Interview</p>
                  <p className="text-xs text-muted-foreground">Upcoming</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
