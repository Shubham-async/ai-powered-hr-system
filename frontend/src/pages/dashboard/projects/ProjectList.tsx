import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Briefcase, TrendingUp, Users, ChevronRight, LayoutGrid, ListFilter, AlertCircle, MoreVertical, Edit2, Trash2, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { projectApi } from "@/api/projectApi";
import { toast } from "sonner";
import { Loader } from "@/components/shared/Loader";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusColor: Record<string, string> = {
  Active: "bg-green-500/10 text-green-500 border-green-500/20",
  "On Hold": "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  Completed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
};

const priorityColor: Record<string, string> = {
  Low: "text-slate-400",
  Medium: "text-amber-500",
  High: "text-orange-500",
  Critical: "text-red-500",
};

export default function ProjectList() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "", priority: "Medium", endDate: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await projectApi.getAll();
      setProjects(response.data || []);
    } catch (err) {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleSubmit = async () => {
    if (!form.name) return;
    setSubmitting(true);
    try {
      if (editingProject) {
        await projectApi.update(editingProject._id, form);
        toast.success("Project updated successfully");
      } else {
        await projectApi.create(form);
        toast.success("Project created successfully!");
      }
      setShowCreate(false);
      setEditingProject(null);
      setForm({ name: "", description: "", priority: "Medium", endDate: "" });
      fetchProjects();
    } catch {
      toast.error(editingProject ? "Failed to update" : "Failed to create");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await projectApi.delete(id);
      toast.success("Project deleted");
      fetchProjects();
    } catch {
      toast.error("Failed to delete project");
    }
  };

  const openEdit = (project: any) => {
    setEditingProject(project);
    setForm({
      name: project.name,
      description: project.description || "",
      priority: project.priority || "Medium",
      endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : ""
    });
    setShowCreate(true);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader title="Project Portfolio" description="Track organizational initiatives, team assignments, and real-time delivery health" />
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="icon" className="hidden md:flex" onClick={fetchProjects}><ListFilter className="w-4 h-4" /></Button>
          <Button onClick={() => { setEditingProject(null); setForm({ name: "", description: "", priority: "Medium", endDate: "" }); setShowCreate(true); }} className="gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95">
            <Plus className="w-4 h-4 font-bold" /> New Project
          </Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Strategic Projects", value: projects.length, icon: <LayoutGrid className="w-4 h-4" />, color: "bg-primary/10 text-primary" },
          { label: "Active Execution", value: projects.filter(p => p.status === "Active").length, icon: <TrendingUp className="w-4 h-4" />, color: "bg-green-500/10 text-green-500" },
          { label: "Resources Allocated", value: projects.reduce((s, p) => s + (p.members?.length || 0), 0), icon: <Users className="w-4 h-4" />, color: "bg-purple-500/10 text-purple-500" },
        ].map(s => (
          <Card key={s.label} className="border border-border/50 bg-card/40 backdrop-blur-md shadow-sm">
            <CardContent className="pt-6 pb-6 flex items-center justify-between">
              <div>
                <p className="text-3xl font-black text-foreground tracking-tighter">{s.value}</p>
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-1">{s.label}</p>
              </div>
              <div className={`p-4 rounded-2xl ${s.color}`}>
                {s.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Form */}
      {showCreate && (
        <Card className="border border-primary/30 bg-primary/5 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
          <CardHeader>
            <CardTitle className="text-lg">{editingProject ? "Update Project" : "Initiate New Project"}</CardTitle>
            <CardDescription>{editingProject ? "Modify existing initiative parameters." : "Enter high-level details to create a new workspace for your team."}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Project Name</label>
                <Input
                  placeholder="e.g., Q2 Talent Expansion"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Target Completion</label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
               <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Strategic Priority</label>
               <div className="flex gap-2">
                  {["Low", "Medium", "High", "Critical"].map(p => (
                    <Button 
                      key={p} 
                      type="button"
                      variant={form.priority === p ? "default" : "outline"} 
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => setForm(f => ({ ...f, priority: p }))}
                    >
                      {p}
                    </Button>
                  ))}
               </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Project Description</label>
              <Textarea
                placeholder="Succinctly define the scope and goals..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={handleSubmit} disabled={submitting} className="flex-1 font-bold">
                {submitting ? "Processing..." : editingProject ? "Save Changes" : "Launch Project"}
              </Button>
              <Button variant="ghost" onClick={() => { setShowCreate(false); setEditingProject(null); }}>Dismiss</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center gap-4">
          <Loader size="lg" />
          <p className="text-sm text-muted-foreground animate-pulse">Syncing Portfolio...</p>
        </div>
      ) : projects.length === 0 ? (
        <Card className="border border-dashed border-border/50 bg-muted/5">
          <CardContent className="py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <h3 className="text-lg font-bold">No Active Projects</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-2">
              Your strategic portfolio is currently empty. Initialize a project manually or use Aurion AI to draft one.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project: any) => (
            <Card
              key={project._id}
              className="group border border-border/50 bg-card/30 hover:bg-card/60 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col"
              onClick={() => navigate(`/dashboard/projects/${project._id}`)}
            >
              <div className="h-1.5 w-full bg-muted/20 overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(var(--primary),0.5)]" 
                  style={{ width: `${project.completionPercent ?? 0}%` }} 
                />
              </div>
              <CardContent className="pt-6 pb-6 flex-1 flex flex-col relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="min-w-0 pr-6">
                    <h3 className="font-bold text-lg text-foreground tracking-tight truncate group-hover:text-primary transition-colors">
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-widest px-2 py-0 h-4 border-none shadow-none ${statusColor[project.status] || ""}`}>
                        {project.status || "Active"}
                      </Badge>
                      <span className={`text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5 ${priorityColor[project.priority] || "text-slate-400"}`}>
                        <div className={`w-1 h-1 rounded-full bg-current`} /> {project.priority}
                      </span>
                    </div>
                  </div>
                  
                  <div className="absolute right-4 top-5" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => openEdit(project)} className="gap-2 cursor-pointer">
                          <Edit2 className="h-3.5 w-3.5" /> Edit Project
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(project._id)} className="gap-2 text-destructive cursor-pointer focus:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" /> Delete Project
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="flex-1 mb-6">
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed h-8 mb-2">
                    {project.description || "No strategic overview provided for this initiative."}
                  </p>
                  {project.projectLeadId && (
                    <div className="flex items-center gap-2 mt-2 py-1 px-2 bg-muted/40 rounded-lg w-fit">
                      <User className="w-3 h-3 text-primary" />
                      <span className="text-[10px] font-bold uppercase text-foreground/80">{project.projectLeadId.firstName} {project.projectLeadId.lastName}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t border-border/30">
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                       {(project.members || []).length > 0 ? (
                         project.members.slice(0, 3).map((m: any, i: number) => (
                           <div key={i} title={`${m.employeeId?.firstName} ${m.employeeId?.lastName}`} className="w-8 h-8 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-[10px] font-bold text-primary group-hover:border-primary/20 transition-all shadow-sm">
                             {m.employeeId?.firstName?.[0] || 'U'}
                           </div>
                         ))
                       ) : (
                         <div className="w-8 h-8 rounded-full bg-muted/30 border-2 border-background flex items-center justify-center text-muted-foreground/40">
                            <Users className="w-4 h-4" />
                         </div>
                       )}
                       {(project.members?.length > 3) && (
                         <div className="w-8 h-8 rounded-full bg-muted/80 border-2 border-background flex items-center justify-center text-[8px] font-bold text-foreground">
                           +{project.members.length - 3}
                         </div>
                       )}
                    </div>
                    <div className="text-right">
                       <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-0.5 tracking-tighter">Health Score</span>
                       <Badge variant="secondary" className={`text-xs font-black rounded-sm border-none shadow-none ${project.healthScore >= 70 ? 'text-green-500 bg-green-500/10' : project.healthScore >= 40 ? 'text-amber-500 bg-amber-500/10' : 'text-red-500 bg-red-500/10'}`}>
                         {project.healthScore ?? 50}%
                       </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


