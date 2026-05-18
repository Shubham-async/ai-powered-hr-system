import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Eye, Edit, Trash2, CheckCircle, XCircle, Send } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader } from "@/components/shared/Loader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { jdApi } from "@/api/jdApi";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { JobDescription } from "@/types/jd";

export default function JDList() {
  const navigate = useNavigate();
  const { data: jds, isLoading, error, refetch } = useQuery({
    queryKey: ['jds'],
    queryFn: jdApi.getAll,
  });

  const getStatusBadge = (status: JobDescription['status']) => {
    const variants = {
      processing: { variant: "secondary" as const, label: "Processing" },
      queued: { variant: "secondary" as const, label: "Queued" },
      completed: { variant: "default" as const, label: "Completed" },
      failed: { variant: "destructive" as const, label: "Failed" },
    };
    const config = variants[status];
    return <Badge variant={config?.variant || "secondary"}>{config?.label}</Badge>;
  };

  const getApprovalBadge = (status: JobDescription['approvalStatus']) => {
    const variants = {
      pending: { className: "bg-warning text-warning-foreground", label: "Pending" },
      approved: { className: "bg-success text-success-foreground", label: "Approved" },
      rejected: { className: "bg-destructive text-destructive-foreground", label: "Rejected" },
    };
    const config = variants[status];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const handleApprove = async (id: string) => {
    try {
      await jdApi.update(id, { approvalStatus: 'approved' });
      toast.success("JD approved successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to approve JD");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await jdApi.update(id, { approvalStatus: 'rejected' });
      toast.success("JD rejected");
      refetch();
    } catch (error) {
      toast.error("Failed to reject JD");
    }
  };

  const handleRefer = async (id: string) => {
    try {
      navigate(`/apply/${id}`);
    } catch (error) {
      toast.error("Failed to refer JD");
    }
  }
  const handleDelete = async (id: string) => {
    try {
      await jdApi.delete(id);
      toast.success("JD deleted successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to delete JD");
    }
  };

  if (isLoading) return <Loader size="lg" text="Loading job descriptions..." />;
  if (error) return <ErrorState message="Failed to load job descriptions" retry={refetch} />;

  return (
    <div>
      <PageHeader
        title="Job Descriptions"
        description="Manage and create AI-powered job descriptions"
        actions={
          <Button onClick={() => navigate('/dashboard/jd/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create JD
          </Button>
        }
      />

      {!jds || jds.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="No job descriptions yet"
          description="Create your first AI-powered job description to get started"
          action={{
            label: "Create JD",
            onClick: () => navigate('/dashboard/jd/create'),
          }}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Approval</TableHead>
                  <TableHead>Skills</TableHead>
                  <TableHead>Salary Range</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jds && jds.map((jd) => !jd.aiResponse ? null : (
                  <TableRow key={jd._id}>
                    <TableCell className="font-medium">{jd.aiResponse.jobTitle}</TableCell>
                    <TableCell>{getStatusBadge(jd.status)}</TableCell>
                    <TableCell>{getApprovalBadge(jd.approvalStatus)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(jd.aiResponse.skills || []).slice(0, 3).map((skill, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {(jd.aiResponse.skills || []).length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{(jd.aiResponse.skills || []).length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{jd.aiResponse.salaryRange}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(jd.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">Actions</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/dashboard/jd/${jd._id}`,{state: jd})}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {jd.approvalStatus === 'pending' && (
                            <>
                              <DropdownMenuItem onClick={() => handleApprove(jd._id)}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleReject(jd._id)}>
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRefer(jd._id)}>
                                <XCircle className="h-4 w-4 mr-2" />
                                Refer Form
                              </DropdownMenuItem>
                            </>
                          )}
                          {jd.approvalStatus === 'approved' && (
                            <DropdownMenuItem onClick={() => navigate(`/dashboard/jd/${jd._id}/post`)}>
                              <Send className="h-4 w-4 mr-2" />
                              Post to Platforms
                            </DropdownMenuItem>
                            
                          )}
                          <DropdownMenuItem onClick={() => handleDelete(jd._id)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRefer(jd._id)}>
                                <XCircle className="h-4 w-4 mr-2" />
                                Refer Form
                              </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
