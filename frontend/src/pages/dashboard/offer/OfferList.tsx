import { useQuery, useMutation } from "@tanstack/react-query";
import { Gift, Plus, Send, Eye } from "lucide-react";
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
import { Loader } from "@/components/shared/Loader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { offerApi } from "@/api/offerApi";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useState } from "react";

export default function OfferList() {
  const navigate = useNavigate();
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  
  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ['offers'],
    queryFn: offerApi.list,
  });

  const offersArr = response?.offers || [];

  const handlePreview = (offer: any) => {
    setSelectedOffer(offer);
    setPreviewOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      draft: { className: "bg-secondary text-secondary-foreground", label: "Draft" },
      pending_approval: { className: "bg-warning text-warning-foreground", label: "Pending Approval" },
      approved: { className: "bg-success text-success-foreground", label: "Approved" },
      sent: { className: "bg-info text-info-foreground", label: "Sent" },
      accepted: { className: "bg-success text-success-foreground", label: "Accepted" },
      rejected: { className: "bg-destructive text-destructive-foreground", label: "Rejected" },
    };
    const config = variants[status] || variants.draft;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (isLoading) return <Loader size="lg" text="Loading offers..." />;
  if (error) return <ErrorState message="Failed to load offers" retry={refetch} />;

  return (
    <div>
      <PageHeader
        title="Offer Management"
        description="Create and track job offers"
        actions={
          <Button onClick={() => navigate('/dashboard/offer/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Offer
          </Button>
        }
      />

      {!offersArr || offersArr.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="No offers created yet"
          description="Create offer letters for selected candidates from the Interview or Assessment tabs"
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offersArr.map((offer: any) => (
                  <TableRow key={offer._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{offer.candidate_id?.name || "Candidate"}</p>
                        <p className="text-sm text-muted-foreground">{offer.candidate_id?.email || "N/A"}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{offer.job_id?.aiResponse?.jobTitle || "Developer"}</TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {offer.salary_offered?.currency || "INR"} {(offer.salary_offered?.amount || 0).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(offer.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {offer.sent_at ? new Date(offer.sent_at).toLocaleDateString() : 'Not Sent'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handlePreview(offer)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Letter
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Offer Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Offer Letter Preview</DialogTitle>
            <DialogDescription>
              Sent to {selectedOffer?.candidate_id?.name} for the {selectedOffer?.job_id?.aiResponse?.jobTitle} position.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 p-6 bg-muted rounded-md whitespace-pre-wrap font-serif text-sm leading-relaxed border">
            {selectedOffer?.offer_letter_text}
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
