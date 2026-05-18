import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Users, Target, MessageSquare, Plus,
  CheckCircle2, Clock, AlertTriangle, Circle, Bot, TrendingUp
} from "lucide-react";

const API = import.meta.env.VITE_MAIN_API_URL || "https://backend-1s6m.onrender.com/api";
const EMPLOYEE_ID = "EMP001";

const milestoneStatusIcons: Record<string, JSX.Element> = {
  "Not Started": <Circle className="w-4 h-4 text-muted-foreground" />,
  "In Progress": <Clock className="w-4 h-4 text-blue-400" />,
  "Completed": <CheckCircle2 className="w-4 h-4 text-green-400" />,
  "Delayed": <AlertTriangle className="w-4 h-4 text-red-400" />,
};

const sentimentColors: Record<string, string> = {
  Positive: "text-green-400",
  Neutral: "text-muted-foreground",
  Negative: "text-red-400",
  Unknown: "text-muted-foreground",
};

const healthColor = (score: number) => {
  if (score >= 70) return "bg-green-500";
  if (score >= 40) return "bg-yellow-500";
  return "bg-red-500";
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // Forms
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({ title: "", description: "", deadline: "" });
  const [feedbackText, setFeedbackText] = useState("");
  const [memberEmpId, setMemberEmpId] = useState("");
  const [memberRole, setMemberRole] = useState("Member");
  const [submitting, setSubmitting] = useState(false);

  const fetchProject = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/projects/${id}`);
      const data = await res.json();
      setProject(data.data);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchProject(); }, [id]);

  const addMilestone = async () => {
    if (!milestoneForm.title) return;
    setSubmitting(true);
    try {
      await fetch(`${API}/projects/${id}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(milestoneForm),
      });
      setShowMilestoneForm(false);
      setMilestoneForm({ title: "", description: "", deadline: "" });
      fetchProject();
    } catch { } finally { setSubmitting(false); }
  };

  const updateMilestoneStatus = async (milestoneId: string, status: string) => {
    try {
      await fetch(`${API}/projects/${id}/milestones/${milestoneId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchProject();
    } catch { }
  };

  const submitFeedback = async () => {
    if (!feedbackText.trim()) return;
    setSubmitting(true);
    try {
      await fetch(`${API}/projects/${id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: EMPLOYEE_ID, message: feedbackText, submittedVia: "form" }),
      });
      setFeedbackText("");
      setShowFeedbackForm(false);
      fetchProject();
    } catch { } finally { setSubmitting(false); }
  };

  const addMember = async () => {
    if (!memberEmpId) return;
    setSubmitting(true);
    try {
      await fetch(`${API}/projects/${id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: memberEmpId, role: memberRole }),
      });
      setMemberEmpId("");
      setShowMemberForm(false);
      fetchProject();
    } catch { } finally { setSubmitting(false); }
  };

  const fetchAISummary = async () => {
    setLoadingAI(true);
    try {
      const res = await fetch(`${API}/projects/${id}/health-summary`);
      const data = await res.json();
      setAiFeedback(data.summary || "Could not generate summary.");
    } catch { setAiFeedback("Error fetching AI summary."); } finally { setLoadingAI(false); }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading project...</div>;
  if (!project) return <div className="p-8 text-center text-muted-foreground">Project not found.</div>;

  const { milestoneStats, sentimentBreakdown } = project;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/projects")} className="shrink-0 mt-0.5">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <PageHeader
            title={project.name}
            description={project.description || "No description"}
          />
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border border-border/50">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Progress</p>
            <p className="text-2xl font-bold">{project.completionPercent ?? 0}%</p>
            <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${project.completionPercent ?? 0}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border/50">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Health Score</p>
            <p className="text-2xl font-bold flex items-center gap-2">
              {project.healthScore ?? 50}
              <div className={`w-2.5 h-2.5 rounded-full ${healthColor(project.healthScore ?? 50)}`} />
            </p>
            <p className="text-[10px] text-muted-foreground">out of 100</p>
          </CardContent>
        </Card>
        <Card className="border border-border/50">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Team Size</p>
            <p className="text-2xl font-bold">{project.members?.length ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">members</p>
          </CardContent>
        </Card>
        <Card className="border border-border/50">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Milestones</p>
            <p className="text-2xl font-bold">
              {milestoneStats?.completed ?? 0}/{milestoneStats?.total ?? 0}
            </p>
            <p className="text-[10px] text-muted-foreground">completed</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Health Summary */}
      <Card className="border border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-primary">Aurion AI Health Summary</p>
                <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={fetchAISummary} disabled={loadingAI}>
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {loadingAI ? "Generating..." : "Generate"}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {aiFeedback || "Click Generate to get an AI-powered health analysis of this project."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="milestones">
        <TabsList>
          <TabsTrigger value="milestones" className="gap-1.5">
            <Target className="w-3.5 h-3.5" /> Milestones
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-1.5">
            <Users className="w-3.5 h-3.5" /> Team
          </TabsTrigger>
          <TabsTrigger value="feedback" className="gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" /> Feedback
          </TabsTrigger>
        </TabsList>

        {/* ── Milestones ───────────────────────────────────────────── */}
        <TabsContent value="milestones" className="space-y-3 mt-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowMilestoneForm(v => !v)} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add Milestone
            </Button>
          </div>

          {showMilestoneForm && (
            <Card className="border border-primary/30">
              <CardContent className="pt-4 pb-4 space-y-3">
                <input
                  placeholder="Milestone title *"
                  value={milestoneForm.title}
                  onChange={e => setMilestoneForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <input
                  placeholder="Description (optional)"
                  value={milestoneForm.description}
                  onChange={e => setMilestoneForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <input
                  type="date"
                  value={milestoneForm.deadline}
                  onChange={e => setMilestoneForm(f => ({ ...f, deadline: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={addMilestone} disabled={submitting} className="flex-1">
                    {submitting ? "Adding..." : "Add Milestone"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowMilestoneForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!project.milestones?.length ? (
            <p className="text-center text-muted-foreground text-sm py-6">No milestones yet.</p>
          ) : (
            project.milestones.map((m: any) => (
              <div key={m._id} className="flex items-center gap-3 p-3.5 rounded-lg border border-border/40 bg-muted/20">
                {milestoneStatusIcons[m.status] || <Circle className="w-4 h-4" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{m.title}</p>
                  {m.description && <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>}
                  {m.deadline && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Due: {new Date(m.deadline).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <select
                  value={m.status}
                  onChange={e => updateMilestoneStatus(m._id, e.target.value)}
                  className="text-xs rounded border border-input bg-background px-2 py-1"
                >
                  {["Not Started", "In Progress", "Completed", "Delayed"].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            ))
          )}
        </TabsContent>

        {/* ── Team ─────────────────────────────────────────────────── */}
        <TabsContent value="team" className="space-y-3 mt-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowMemberForm(v => !v)} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add Member
            </Button>
          </div>

          {showMemberForm && (
            <Card className="border border-primary/30">
              <CardContent className="pt-4 pb-4 space-y-3">
                <input
                  placeholder="Employee ID *"
                  value={memberEmpId}
                  onChange={e => setMemberEmpId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <select
                  value={memberRole}
                  onChange={e => setMemberRole(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {["Member", "Lead", "Reviewer"].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <div className="flex gap-2">
                  <Button size="sm" onClick={addMember} disabled={submitting} className="flex-1">
                    {submitting ? "Adding..." : "Add to Project"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowMemberForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!project.members?.length ? (
            <p className="text-center text-muted-foreground text-sm py-6">No team members yet.</p>
          ) : (
            <div className="space-y-2">
              {project.members.map((m: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3.5 rounded-lg border border-border/40 bg-muted/20">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {(m.employeeId?.name || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{m.employeeId?.name || m.employeeId || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{m.employeeId?.email}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{m.role}</Badge>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Feedback ──────────────────────────────────────────────── */}
        <TabsContent value="feedback" className="space-y-3 mt-4">
          {/* Sentiment Summary */}
          {sentimentBreakdown && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Positive", count: sentimentBreakdown.positive, color: "text-green-400" },
                { label: "Neutral", count: sentimentBreakdown.neutral, color: "text-muted-foreground" },
                { label: "Negative", count: sentimentBreakdown.negative, color: "text-red-400" },
              ].map(s => (
                <Card key={s.label} className="border border-border/50">
                  <CardContent className="pt-3 pb-3 text-center">
                    <p className={`text-xl font-bold ${s.color}`}>{s.count}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowFeedbackForm(v => !v)} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Submit Feedback
            </Button>
          </div>

          {showFeedbackForm && (
            <Card className="border border-primary/30">
              <CardContent className="pt-4 pb-4 space-y-3">
                <textarea
                  placeholder="Share your feedback about this project..."
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={submitFeedback} disabled={submitting} className="flex-1">
                    {submitting ? "Analyzing & Saving..." : "Submit Feedback ✨"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowFeedbackForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!project.feedbackLog?.length ? (
            <p className="text-center text-muted-foreground text-sm py-6">No feedback yet.</p>
          ) : (
            <div className="space-y-2">
              {project.feedbackLog.slice().reverse().map((f: any) => (
                <div key={f._id} className="p-3.5 rounded-lg border border-border/40 bg-muted/20">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-semibold ${sentimentColors[f.sentiment] || ""}`}>
                      {f.sentiment}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(f.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm">{f.message}</p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
