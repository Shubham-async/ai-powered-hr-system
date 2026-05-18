import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Send, Check, Linkedin, Globe, Briefcase, Info, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { jdApi } from "@/api/jdApi";
import { toast } from "sonner";
import { Loader } from "@/components/shared/Loader";

const PLATFORMS = [
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "text-blue-600", description: "Reach millions of professionals worldwide" },
  { id: "indeed", name: "Indeed", icon: Briefcase, color: "text-blue-500", description: "Target the most active job seekers" },
  { id: "glassdoor", name: "Glassdoor", icon: Globe, color: "text-green-600", description: "Showcase your company culture" },
  { id: "custom", name: "Aurion Portal", icon: Send, color: "text-primary", description: "Post to your internal AI-powered portal" },
];

export default function JDPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["linkedin", "custom"]);

  const { data: jd, isLoading } = useQuery({
    queryKey: ["jd", id],
    queryFn: () => jdApi.getById(id!),
    enabled: !!id,
  });

  const postMutation = useMutation({
    mutationFn: (platforms: string[]) => jdApi.createPost(id!, { platforms }),
    onSuccess: () => {
      toast.success("Job Description published successfully!");
      navigate("/dashboard/jd");
    },
    onError: () => {
      toast.error("Failed to publish JD. Please try again.");
    },
  });

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handlePost = () => {
    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform");
      return;
    }
    postMutation.mutate(selectedPlatforms);
  };

  if (isLoading) return <Loader size="lg" text="Loading JD details..." />;
  if (!jd) return <div>JD not found</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <Button 
        variant="ghost" 
        size="sm" 
        className="mb-4" 
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to List
      </Button>

      <PageHeader
        title="Post to Platforms"
        description={`Reach candidates by publishing "${jd.aiResponse.jobTitle}" across major job boards.`}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {/* Left Column: Platform Selection */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Target Platforms</CardTitle>
              <CardDescription>Choose where you want to publish this job listing.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {PLATFORMS.map((platform) => (
                <div
                  key={platform.id}
                  className={`flex items-center space-x-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    selectedPlatforms.includes(platform.id)
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-transparent bg-muted/30 hover:bg-muted/50"
                  }`}
                  onClick={() => togglePlatform(platform.id)}
                >
                  <div className={`p-2 rounded-lg bg-white shadow-sm ${platform.color}`}>
                    <platform.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{platform.name}</div>
                    <div className="text-sm text-muted-foreground">{platform.description}</div>
                  </div>
                  <Checkbox 
                    checked={selectedPlatforms.includes(platform.id)}
                    className="h-5 w-5 rounded-full"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="p-4 bg-info/10 border border-info/20 rounded-xl flex gap-3">
            <Info className="h-5 w-5 text-info shrink-0" />
            <div className="text-sm text-info-foreground">
              Posting to external platforms like LinkedIn and Indeed may take up to 2 hours to appear live in search results.
            </div>
          </div>
        </div>

        {/* Right Column: Preview & Action */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Role</div>
                <div className="font-semibold text-lg">{jd.aiResponse.jobTitle}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Location</div>
                <div>{jd.aiResponse.location}</div>
              </div>
              <div className="pt-4 border-t space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Selected Platforms</span>
                  <span className="font-bold">{selectedPlatforms.length}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedPlatforms.map(p => (
                    <Badge key={p} variant="secondary" className="capitalize">
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button 
                className="w-full h-12 text-lg shadow-lg active:scale-95 transition-transform"
                onClick={handlePost}
                disabled={postMutation.isPending}
              >
                {postMutation.isPending ? (
                  <>
                    <Loader size="sm"/>
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    Publish Listing
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
