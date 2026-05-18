import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardStats } from "@/components/shared/CardStats";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Briefcase, ClipboardList, TrendingUp, Mic } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Sector
} from "recharts";

const API = (import.meta.env.VITE_MAIN_API_URL || "https://backend-1s6m.onrender.com/api") + "/analytics";
const COLORS = ["#6366f1", "#22d3ee", "#f59e0b", "#10b981", "#f43f5e", "#a78bfa"];

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;
  return (
    <g>
      <text x={cx} y={cy - 8} textAnchor="middle" fill="#fff" className="text-sm font-bold">{payload.name}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#94a3b8" className="text-xs">{(percent * 100).toFixed(1)}%</text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} />
    </g>
  );
};

export default function AnalyticsDashboard() {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<any>(null);
  const [hiringFunnel, setHiringFunnel] = useState<any[]>([]);
  const [leaveHeatmap, setLeaveHeatmap] = useState<any[]>([]);
  const [headcount, setHeadcount] = useState<any[]>([]);
  const [projectHealth, setProjectHealth] = useState<any[]>([]);
  const [leaveDistribution, setLeaveDistribution] = useState<any[]>([]);
  const [activePieIndex, setActivePieIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [kpiRes, funnelRes, leaveRes, hcRes, projRes, ldRes] = await Promise.all([
          fetch(`${API}/kpis`).then(r => r.json()),
          fetch(`${API}/hiring-funnel`).then(r => r.json()),
          fetch(`${API}/leave-heatmap`).then(r => r.json()),
          fetch(`${API}/headcount`).then(r => r.json()),
          fetch(`${API}/project-health`).then(r => r.json()),
          fetch(`${API}/leave-distribution`).then(r => r.json()),
        ]);
        setKpis(kpiRes.data);
        setHiringFunnel(funnelRes.data || []);
        setLeaveHeatmap(leaveRes.data || []);
        setHeadcount(hcRes.data || []);
        setProjectHealth(projRes.data || []);
        setLeaveDistribution(ldRes.data || []);
      } catch { }
      setLoading(false);
    };
    fetchAll();
  }, []);

  const tooltipStyle = { backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9" };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <PageHeader title="Analytics & Presentations" description="Voice-driven HR insights — ask Aurion to generate any chart" />
        <Button variant="outline" onClick={() => navigate("/dashboard/huria")} className="gap-2 shrink-0">
          <Mic className="w-4 h-4" /> Ask Aurion
        </Button>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <CardStats title="Total Employees" value={String(kpis.totalEmployees ?? 0)} icon={Users} />
          <CardStats title="Pending Leaves" value={String(kpis.pendingLeaves ?? 0)} icon={ClipboardList} trend={{ value: 0, isPositive: false }} />
          <CardStats title="Active Projects" value={String(kpis.activeProjects ?? 0)} icon={Briefcase} />
          <CardStats title="Open JDs" value={String(kpis.openJDs ?? 0)} icon={TrendingUp} />
        </div>
      )}

      {loading && (
        <div className="py-12 text-center text-muted-foreground text-sm">Loading analytics...</div>
      )}

      {!loading && (
        <Tabs defaultValue="hiring">
          <TabsList className="mb-4">
            <TabsTrigger value="hiring">Hiring</TabsTrigger>
            <TabsTrigger value="leave">Leave</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="headcount">Headcount</TabsTrigger>
          </TabsList>

          {/* ── Hiring Funnel ────────────────────────────── */}
          <TabsContent value="hiring">
            <Card className="border border-border/50">
              <CardHeader><CardTitle className="text-base">Hiring Funnel</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={hiringFunnel} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]}>
                      {hiringFunnel.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Leave Heatmap ────────────────────────────── */}
          <TabsContent value="leave">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border border-border/50">
                <CardHeader><CardTitle className="text-base">Monthly Leave Usage</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={leaveHeatmap} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend />
                      <Line type="monotone" dataKey="count" stroke="#22d3ee" strokeWidth={2} dot={{ r: 4, fill: "#22d3ee" }} name="Requests" />
                      <Line type="monotone" dataKey="totalDays" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: "#f59e0b" }} name="Total Days" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="border border-border/50">
                <CardHeader><CardTitle className="text-base">Leave Type Distribution</CardTitle></CardHeader>
                <CardContent className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={leaveDistribution} cx="50%" cy="50%"
                        activeIndex={activePieIndex} activeShape={renderActiveShape}
                        innerRadius={70} outerRadius={100}
                        dataKey="count" nameKey="name"
                        onMouseEnter={(_, index) => setActivePieIndex(index)}
                      >
                        {leaveDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Project Health ───────────────────────────── */}
          <TabsContent value="projects">
            <Card className="border border-border/50">
              <CardHeader><CardTitle className="text-base">Project Health & Completion</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={projectHealth} margin={{ top: 5, right: 10, left: -10, bottom: 5 }} layout="vertical">
                    <XAxis type="number" domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" stroke="#64748b" tick={{ fontSize: 11 }} width={100} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `${v}%`} />
                    <Legend />
                    <Bar dataKey="health" name="Health Score" fill="#10b981" radius={[0, 6, 6, 0]} />
                    <Bar dataKey="completion" name="Completion %" fill="#6366f1" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Headcount ────────────────────────────────── */}
          <TabsContent value="headcount">
            <Card className="border border-border/50">
              <CardHeader><CardTitle className="text-base">Headcount by Department</CardTitle></CardHeader>
              <CardContent className="flex justify-center">
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie data={headcount} cx="50%" cy="50%" outerRadius={120} dataKey="count" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={true}>
                      {headcount.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
