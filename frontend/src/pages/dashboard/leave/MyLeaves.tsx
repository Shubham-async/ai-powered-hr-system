import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, CheckCircle2, XCircle, AlertCircle, Plus, Mic } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_MAIN_API_URL || "https://backend-1s6m.onrender.com/api";
const EMPLOYEE_ID = "EMP001"; // TODO: replace with auth store value

const statusColor: Record<string, string> = {
  Pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Approved: "bg-green-500/20 text-green-400 border-green-500/30",
  Rejected: "bg-red-500/20 text-red-400 border-red-500/30",
  "Under Review": "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const statusIcon: Record<string, JSX.Element> = {
  Pending: <AlertCircle className="w-4 h-4 text-yellow-400" />,
  Approved: <CheckCircle2 className="w-4 h-4 text-green-400" />,
  Rejected: <XCircle className="w-4 h-4 text-red-400" />,
  "Under Review": <Clock className="w-4 h-4 text-blue-400" />,
};

export default function MyLeaves() {
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ leaveType: "Casual", startDate: "", endDate: "", reason: "" });
  const [preview, setPreview] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statusRes, balanceRes] = await Promise.all([
        fetch(`${API}/leave/status/${EMPLOYEE_ID}`),
        fetch(`${API}/leave/balance/${EMPLOYEE_ID}`),
      ]);
      const statusData = await statusRes.json();
      const balanceData = await balanceRes.json();
      setLeaves(statusData.data?.recent || []);
      setBalance(balanceData.data);
    } catch {
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async () => {
    if (!form.startDate || !form.endDate || !form.reason) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/leave/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: EMPLOYEE_ID, ...form }),
      });
      const data = await res.json();
      setPreview(data.agentNote || "Request filed successfully.");
      setShowForm(false);
      setForm({ leaveType: "Casual", startDate: "", endDate: "", reason: "" });
      fetchData();
    } catch {
      setPreview("Failed to file leave. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Leave Requests"
        description="Aurion files your leave professionally to HR — no mailing needed"
      />

      {/* Balance Cards */}
      {balance && (
        <div className="grid grid-cols-3 gap-4">
          {["annual", "sick", "casual"].map((type) => (
            <Card key={type} className="border border-border/50 bg-card/80 backdrop-blur">
              <CardContent className="pt-5 pb-4">
                <p className="text-xs text-muted-foreground capitalize">{type} Leave</p>
                <p className="text-3xl font-bold mt-1">{balance[type] ?? "--"}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {balance.used?.[type] ?? 0} used
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Agent Note Preview */}
      {preview && (
        <Card className="border border-primary/30 bg-primary/5">
          <CardContent className="pt-4 pb-4 flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs font-bold text-primary">AI</span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Aurion's note sent to HR:</p>
              <p className="text-sm">{preview}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Request form */}
      {showForm ? (
        <Card className="border border-primary/30 bg-card/80">
          <CardHeader><CardTitle className="text-base">New Leave Request</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Select value={form.leaveType} onValueChange={(v) => setForm(f => ({ ...f, leaveType: v }))}>
              <SelectTrigger><SelectValue placeholder="Leave Type" /></SelectTrigger>
              <SelectContent>
                {["Casual", "Sick", "Earned", "Unpaid", "Paternity", "Maternity"].map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Start Date</label>
                <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">End Date</label>
                <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
            </div>
            <Textarea placeholder="Reason (Aurion will write the professional note for HR)" value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={3} />
            <div className="flex gap-2 pt-1">
              <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
                {submitting ? "Filing via Aurion..." : "Submit via Aurion ✨"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex gap-3">
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Request Leave
          </Button>
          <Button variant="outline" onClick={() => navigate("/dashboard/huria")} className="gap-2">
            <Mic className="w-4 h-4" /> Ask Aurion by Voice
          </Button>
        </div>
      )}

      {/* Leave History */}
      <Card className="border border-border/50">
        <CardHeader><CardTitle className="text-base">Leave History</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground text-sm">Loading...</div>
          ) : leaves.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">No leave requests yet.</div>
          ) : (
            <div className="space-y-3">
              {leaves.map((leave: any) => (
                <div key={leave._id} className="flex items-start gap-4 p-4 rounded-lg border border-border/40 bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="mt-0.5">{statusIcon[leave.status] || <AlertCircle className="w-4 h-4" />}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{leave.leaveType} Leave</span>
                      <Badge className={`text-xs border ${statusColor[leave.status] || ""}`}>{leave.status}</Badge>
                      {leave.mediatedBy === "agent" && (
                        <Badge variant="outline" className="text-xs text-primary border-primary/30">via Aurion</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(leave.startDate).toLocaleDateString()} – {new Date(leave.endDate).toLocaleDateString()}
                      <span className="ml-1">({leave.totalDays} day{leave.totalDays !== 1 ? "s" : ""})</span>
                    </p>
                    {leave.reason && <p className="text-xs text-muted-foreground mt-1 truncate">{leave.reason}</p>}
                    {leave.hrComment && (
                      <p className="text-xs mt-1 text-blue-400">HR: {leave.hrComment}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
