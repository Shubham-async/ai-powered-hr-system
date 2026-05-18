import { useState, useEffect, useCallback } from "react";
import { Bell, CheckCheck, Calendar, Briefcase, AlertCircle, Gift, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import axiosClient from "@/api/axiosClient";

const EMPLOYEE_ID = "EMP001"; // TODO: replace with auth store

const typeIcon: Record<string, JSX.Element> = {
  leave_filed: <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />,
  leave_approved: <CheckCheck className="w-3.5 h-3.5 text-green-400" />,
  leave_rejected: <AlertCircle className="w-3.5 h-3.5 text-red-400" />,
  interview_scheduled: <Calendar className="w-3.5 h-3.5 text-blue-400" />,
  project_assigned: <Briefcase className="w-3.5 h-3.5 text-purple-400" />,
  milestone_due: <ClipboardList className="w-3.5 h-3.5 text-orange-400" />,
  onboarding_task: <Gift className="w-3.5 h-3.5 text-pink-400" />,
  general: <Bell className="w-3.5 h-3.5 text-muted-foreground" />,
};

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await axiosClient.get(`/notifications/${EMPLOYEE_ID}?limit=20`);
      setNotifications(data.data || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Poll every 15 seconds for new notifications
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAllRead = async () => {
    try {
      await axiosClient.patch(`/notifications/${EMPLOYEE_ID}/read-all`);
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const markOneRead = async (id: string) => {
    try {
      await axiosClient.patch(`/notifications/single/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark one read:", err);
    }
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" id="notification-bell">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 max-h-[480px] flex flex-col">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0 text-sm font-semibold">
            Notifications {unreadCount > 0 && <span className="text-primary ml-1">({unreadCount} new)</span>}
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={markAllRead}>
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />

        <div className="overflow-y-auto flex-1">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No notifications</div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif._id}
                onClick={() => !notif.read && markOneRead(notif._id)}
                className={`flex items-start gap-3 px-3 py-3 border-b border-border/40 cursor-pointer hover:bg-muted/50 transition-colors ${!notif.read ? "bg-primary/5" : ""
                  }`}
              >
                <div className="mt-0.5 shrink-0">
                  {typeIcon[notif.type] || typeIcon.general}
                </div>
                <div className="flex-1 min-w-0">
                  {notif.title && (
                    <p className="text-xs font-semibold truncate">{notif.title}</p>
                  )}
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mt-0.5">
                    {notif.message}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(notif.createdAt)}</p>
                </div>
                {!notif.read && (
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                )}
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
