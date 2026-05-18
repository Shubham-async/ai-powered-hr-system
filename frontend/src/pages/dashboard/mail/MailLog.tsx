import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mail, Search, Filter, Eye, Clock, User, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { mailApi } from "@/api/mailApi";
import { Loader } from "@/components/shared/Loader";

export default function MailLog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMail, setSelectedMail] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { data: response, isLoading, error } = useQuery({
    queryKey: ["mail-logs"],
    queryFn: () => mailApi.getAll({ limit: 50 }),
  });

  const mails = response?.data || [];

  const filteredMails = mails.filter((mail: any) =>
    mail.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mail.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePreview = (mail: any) => {
    setSelectedMail(mail);
    setPreviewOpen(true);
  };

  const getModuleBadge = (mod: string) => {
    const colors: Record<string, string> = {
      hiring: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      leave: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      offer: "bg-green-500/10 text-green-500 border-green-500/20",
      assessment: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    };
    return (
      <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-wider ${colors[mod?.toLowerCase()] || "bg-muted text-muted-foreground"}`}>
        {mod || "System"}
      </Badge>
    );
  };

  if (isLoading) return <Loader text="Fetching mail logs..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mail Communication Log"
        description="Audit and track all automated emails sent by Aurion across the platform"
      />

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by recipient or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" /> Filter
        </Button>
      </div>

      <Card className="border border-border/50 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[200px]">Recipient</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMails.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No matching logs found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredMails.map((mail: any) => (
                  <TableRow key={mail._id} className="group transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <User className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium truncate max-w-[150px]">{mail.to}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-foreground truncate max-w-[300px]">{mail.subject}</p>
                    </TableCell>
                    <TableCell>{getModuleBadge(mail.relatedModule)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px] uppercase font-bold tracking-wider">
                        Delivered
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">{new Date(mail.createdAt).toLocaleDateString()}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(mail.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handlePreview(mail)} className="hover:bg-primary/10 hover:text-primary">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-primary/10 rounded-full">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <DialogTitle className="text-xl">Email Details</DialogTitle>
            </div>
            <DialogDescription>
              Communication sent from Aurion System
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-xl">
              <div className="space-y-1">
                <p className="text-muted-foreground font-medium">Recipient</p>
                <p className="font-semibold text-foreground">{selectedMail?.to}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground font-medium">Triggered By</p>
                <p className="font-semibold text-foreground uppercase text-xs">{selectedMail?.triggeredBy || "System"}</p>
              </div>
              <div className="space-y-1 col-span-2">
                <p className="text-muted-foreground font-medium">Subject</p>
                <p className="font-semibold text-foreground">{selectedMail?.subject}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-bold text-foreground flex items-center gap-2">
                <ArrowRight className="h-3 w-3 text-primary" /> Email Content
              </p>
              <div className="p-6 bg-white border border-border/50 rounded-2xl shadow-inner min-h-[200px]">
                {selectedMail?.isHtml ? (
                  <div className="prose prose-sm max-w-none prose-slate" dangerouslySetInnerHTML={{ __html: selectedMail?.body }} />
                ) : (
                   <p className="text-sm whitespace-pre-wrap leading-relaxed text-slate-700">{selectedMail?.body}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(selectedMail?.createdAt).toLocaleString()}</span>
                <span className="flex items-center gap-1">Protocol: SMTP/Secure</span>
              </div>
              <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-600 bg-green-50/50">Trace ID: {selectedMail?._id?.slice(-8)}</Badge>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
