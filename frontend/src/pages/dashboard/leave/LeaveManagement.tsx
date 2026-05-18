import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, AlarmClock, Users, ClipboardList, Bot, User } from "lucide-react";
import { leaveApi } from "@/api/leaveApi";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader } from "@/components/shared/Loader";

const statusColor: Record<string, string> = {
  Pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Approved: "bg-green-500/20 text-green-400 border-green-500/30",
  Rejected: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function LeaveManagement() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [comment, setComment] = useState("");
  const [acting, setActing] = useState(false);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const data = await leaveApi.getAll();
      const all = data.data || [];
      setLeaves(all);
      setStats({
        total: all.length,
        pending: all.filter((l: any) => l.status === "Pending").length,
        approved: all.filter((l: any) => l.status === "Approved").length,
        rejected: all.filter((l: any) => l.status === "Rejected").length,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch leave requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaves(); }, []);

  const handleDecision = async (decision: "Approved" | "Rejected") => {
    if (!selectedLeave || !user) return;
    setActing(true);
    try {
      await leaveApi.respond(selectedLeave._id, decision, user._id || user.id, comment);
      toast.success(`Leave ${decision.toLowerCase()} successfully`);
      setSelectedLeave(null);
      setComment("");
      fetchLeaves();
    } catch (err) {
      toast.error("Failed to process decision.");
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Leave Management" description="Review and respond to employee leave requests — Aurion mediates the flow" />

      {/* KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, icon: <ClipboardList className="w-4 h-4" />, color: "text-foreground" },
          { label: "Pending", value: stats.pending, icon: <AlarmClock className="w-4 h-4" />, color: "text-yellow-400" },
          { label: "Approved", value: stats.approved, icon: <CheckCircle2 className="w-4 h-4" />, color: "text-green-400" },
          { label: "Rejected", value: stats.rejected, icon: <XCircle className="w-4 h-4" />, color: "text-red-400" },
        ].map(s => (
          <Card key={s.label} className="border border-border/50 bg-card/80">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <div className={`${s.color}`}>{s.icon}</div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leave Table */}
        <div className="lg:col-span-2">
          <Card className="border border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" /> All Leave Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12"><Loader size="md" /></div>
              ) : leaves.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-12">No leave requests found.</p>
              ) : (
                <div className="space-y-3">
                  {leaves.map((leave: any) => (
                    <div
                      key={leave._id}
                      onClick={() => { setSelectedLeave(leave); setComment(""); }}
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${selectedLeave?._id === leave._id
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border/40 bg-muted/20 hover:bg-muted/40"
                        }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-foreground">
                                {leave.employeeId?.firstName} {leave.employeeId?.lastName}
                              </span>
                              <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">
                                {leave.leaveType}
                              </Badge>
                              <Badge className={`text-[10px] border ${statusColor[leave.status] || ""}`}>{leave.status}</Badge>
                              {leave.mediatedBy === "agent" && (
                                <Badge variant="outline" className="text-[10px] text-primary border-primary/30 flex items-center gap-1">
                                  <Bot className="w-2.5 h-2.5" /> Aurion
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(leave.startDate).toLocaleDateString()} – {new Date(leave.endDate).toLocaleDateString()}
                              <span className="mx-1">·</span>
                              <span className="font-medium">{leave.totalDays} day{leave.totalDays !== 1 ? "s" : ""}</span>
                            </p>
                            {leave.reason && (
                              <p className="text-xs text-muted-foreground mt-2 line-clamp-1 italic">"{leave.reason}"</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] text-muted-foreground">Requested on</p>
                          <p className="text-xs font-medium">{new Date(leave.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detail Panel */}
        <div>
          {selectedLeave ? (
            <Card className="border border-primary/30 bg-card/80 sticky top-6 shadow-lg shadow-primary/5">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-base">Review Request</CardTitle>
                <p className="text-xs text-muted-foreground">Review and take action on this leave petition</p>
              </CardHeader>
              <CardContent className="space-y-5 pt-5">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Employee</span>
                    <span className="font-semibold text-foreground">{selectedLeave.employeeId?.firstName} {selectedLeave.employeeId?.lastName}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Email</span>
                    <span className="text-xs">{selectedLeave.employeeId?.email}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Leave Type</span>
                    <span className="font-medium">{selectedLeave.leaveType}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-bold">{selectedLeave.totalDays} days</span>
                  </div>
                </div>

                {/* Employee reason */}
                {selectedLeave.reason && (
                  <div className="rounded-xl bg-muted/40 p-3 border border-border/40">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2 tracking-tight">Employee Reason</p>
                    <p className="text-sm italic leading-relaxed text-foreground/90">"{selectedLeave.reason}"</p>
                  </div>
                )}

                {/* Aurion Agent Note */}
                {selectedLeave.agentNote && (
                  <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 shadow-sm">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Bot className="w-3.5 h-3.5 text-primary" />
                      <p className="text-[10px] uppercase font-bold text-primary tracking-wider">AI Mediation Summary</p>
                    </div>
                    <p className="text-xs leading-relaxed text-foreground/80">{selectedLeave.agentNote}</p>
                  </div>
                )}

                {selectedLeave.status === "Pending" && (
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label className="text-xs">HR Feedback</Label>
                      <Textarea
                        placeholder="Add a comment for the employee (optional)..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleDecision("Approved")}
                        disabled={acting}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                      </Button>
                      <Button
                        onClick={() => handleDecision("Rejected")}
                        disabled={acting}
                        variant="destructive"
                        className="flex-1 shadow-sm"
                      >
                        <XCircle className="w-4 h-4 mr-2" /> Reject
                      </Button>
                    </div>
                  </div>
                )}
                
                {selectedLeave.status !== "Pending" && (
                  <div className="pt-4 border-t border-border/50">
                    <div className={`p-3 rounded-lg border flex items-center gap-2 ${selectedLeave.status === 'Approved' ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-red-500/10 border-red-500/20 text-red-600'}`}>
                      {selectedLeave.status === 'Approved' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      <span className="text-sm font-semibold lowercase first-letter:uppercase">This request was {selectedLeave.status.toLowerCase()}</span>
                    </div>
                    {selectedLeave.hrComment && (
                      <div className="mt-3 p-3 bg-muted/40 rounded-lg text-xs">
                        <span className="font-bold block mb-1">HR Note:</span>
                        {selectedLeave.hrComment}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-dashed border-border/50 bg-muted/10 h-[400px] flex items-center justify-center">
              <CardContent className="text-center p-8">
                <div className="w-12 h-12 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ClipboardList className="w-6 h-6 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground">Select a leave request from the list to view full details and take action</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode, className?: string }) {
  return <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}>{children}</label>;
}

