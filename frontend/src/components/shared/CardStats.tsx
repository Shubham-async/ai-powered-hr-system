import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface CardStatsProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
}

export const CardStats = ({ title, value, icon: Icon, trend, description }: CardStatsProps) => {
  return (
    <Card className="border border-border/50 bg-card/40 backdrop-blur-md hover:bg-card/60 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-primary/5 group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground mb-2">{title}</p>
            <p className="text-3xl font-black text-foreground tracking-tighter group-hover:scale-105 origin-left transition-transform duration-500">
              {value}
            </p>
            {trend && (
              <div className="flex items-center gap-1.5 mt-3">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${trend.isPositive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {trend.isPositive ? '↑' : '↓'} {trend.value}%
                </span>
                <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">vs last month</span>
              </div>
            )}
            {description && !trend && (
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-3 opacity-60">{description}</p>
            )}
          </div>
          <div className="rounded-2xl bg-primary/10 p-4 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-inner group-hover:rotate-6 group-hover:scale-110">
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
