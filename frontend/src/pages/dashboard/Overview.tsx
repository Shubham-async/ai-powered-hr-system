import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/PageHeader";
import { CardStats } from "@/components/shared/CardStats";
import { Briefcase, Users, ClipboardCheck, Calendar, Bell, ArrowUpRight, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { analyticsApi } from "@/api/analyticsApi";
import { Loader } from "@/components/shared/Loader";

export default function Overview() {
  const { data: kpiRes, isLoading: kpiLoading } = useQuery({
    queryKey: ["dashboard-kpis"],
    queryFn: () => analyticsApi.getKPIs(),
  });

  const { data: funnelRes, isLoading: funnelLoading } = useQuery({
    queryKey: ["hiring-funnel"],
    queryFn: () => analyticsApi.getHiringFunnel(),
  });

  const { data: activityRes } = useQuery({
    queryKey: ["recent-activity"],
    queryFn: () => analyticsApi.getRecentActivity(),
  });

  const kpis = kpiRes?.data || { totalEmployees: 0, pendingLeaves: 0, activeProjects: 0, openJDs: 0 };
  const funnel = funnelRes?.data || [];
  const activities = activityRes?.data?.slice(0, 5) || [];

  if (kpiLoading || funnelLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader size="lg" />
        <p className="text-sm text-muted-foreground animate-pulse font-medium">Synchronizing HR Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <PageHeader
          title="Executive Overview"
          description="Real-time pulse of your organizational health and talent pipeline"
        />
        <div className="bg-primary/5 border border-primary/20 rounded-2xl px-4 py-2 flex items-center gap-3">
           <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary" />
           </div>
           <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Global Status</p>
              <p className="text-xs font-bold text-primary">All Systems Operational</p>
           </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <CardStats
          title="Talent Pool"
          value={kpis.totalEmployees + 120} // Just adding a baseline for demo
          icon={Users}
          trend={{ value: 4, isPositive: true }}
        />
        <CardStats
          title="Active Openings"
          value={kpis.openJDs}
          icon={Briefcase}
          trend={{ value: 2, isPositive: true }}
        />
        <CardStats
          title="Pending Actions"
          value={kpis.pendingLeaves}
          icon={ClipboardCheck}
          description="Leave requests & tasks"
        />
        <CardStats
          title="Live Projects"
          value={kpis.activeProjects}
          icon={Calendar}
          description="Current initiatives"
        />
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Hiring Pipeline Funnel */}
        <Card className="lg:col-span-2 border border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
            <div>
              <CardTitle className="text-lg">Recruitment Funnel</CardTitle>
              <CardDescription>Visualizing candidate progression across all active listings</CardDescription>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
               {funnel.map((stage: any) => (
                 <div key={stage.name} className="flex flex-col items-center text-center p-4 rounded-2xl bg-muted/30 group hover:bg-primary/5 transition-all">
                    <div className={`w-2 h-2 rounded-full ${stage.color || 'bg-primary'} mb-4`} />
                    <p className="text-2xl font-black text-foreground group-hover:scale-110 transition-transform">{stage.count}</p>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1 whitespace-nowrap">{stage.name}</p>
                 </div>
               ))}
            </div>
            
            <div className="mt-8 space-y-4">
               <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Funnel Efficiency</p>
               <div className="flex items-center gap-1 h-3 rounded-full overflow-hidden bg-muted">
                  {funnel.map((stage: any, i: number) => {
                    const total = funnel.reduce((s: number, f: any) => s + f.count, 0);
                    const width = total > 0 ? (stage.count / total) * 100 : 0;
                    return (
                      <div 
                        key={i} 
                        className={`h-full ${stage.color || 'bg-primary'} opacity-80 hover:opacity-100 transition-opacity`} 
                        style={{ width: `${width}%` }} 
                        title={`${stage.name}: ${stage.count}`}
                      />
                    );
                  })}
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Notifications / Activity */}
        <Card className="border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
               <Bell className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-lg">Activity Stream</CardTitle>
              <CardDescription>Latest system triggers</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length === 0 ? (
                <div className="py-10 text-center flex flex-col items-center gap-2">
                   <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                      <Bell className="w-5 h-5" />
                   </div>
                   <p className="text-xs text-muted-foreground">All caught up</p>
                </div>
              ) : (
                activities.map((act: any) => (
                  <div key={act._id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border cursor-default group">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0 group-hover:scale-150 transition-transform" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-foreground line-clamp-1">{act.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">{act.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-2 font-medium bg-muted/80 w-fit px-1.5 py-0.5 rounded">
                        {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

