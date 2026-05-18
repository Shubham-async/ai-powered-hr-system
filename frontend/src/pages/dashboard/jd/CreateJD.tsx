import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Wand2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { jdApi } from "@/api/jdApi";
import { toast } from "sonner";
import { Loader } from "@/components/shared/Loader";

const createJDSchema = z.object({
  prompt: z.string().min(20, "Please provide a detailed description (at least 20 characters)"),
});

type CreateJDFormData = z.infer<typeof createJDSchema>;

export default function CreateJD() {
  const navigate = useNavigate();
  const [generatedJD, setGeneratedJD] = useState<any>(null);

  const form = useForm<CreateJDFormData>({
    resolver: zodResolver(createJDSchema),
    defaultValues: {
      prompt: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: jdApi.create,
    onSuccess: (data) => {
      setGeneratedJD(data);
      toast.success("Job description generated successfully!");
    },
    onError: () => {
      toast.error("Failed to generate job description");
    },
  });

  const onSubmit = (data: CreateJDFormData) => {
    createMutation.mutate({ prompt: data.prompt });
  };

  return (
    <div>
      <PageHeader
        title="Create Job Description"
        description="Use AI to generate a professional job description"
        actions={
          <Button variant="outline" onClick={() => navigate('/dashboard/jd')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to List
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              AI Job Description Generator
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Describe the role</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="E.g., Senior Full Stack Developer with React and Node.js experience, working remotely, salary range $100k-$150k..."
                          className="min-h-[200px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide details about the role, required skills, experience level, location, and salary range
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader size="sm" />}
                  {createMutation.isPending ? "Generating..." : "Generate JD"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Generated Output</CardTitle>
          </CardHeader>
          <CardContent>
            {createMutation.isPending ? (
              <div className="py-12">
                <Loader size="lg" text="AI is crafting your job description..." />
              </div>
            ) : generatedJD ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">{generatedJD.title}</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {generatedJD.description}
                  </p>
                </div>

                {generatedJD.aiMetadata && (
                  <div className="space-y-3 pt-4 border-t">
                    <div>
                      <span className="text-sm font-medium">Skills Required:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {generatedJD.aiMetadata.skills.map((skill: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {generatedJD.aiMetadata.salary && (
                      <div>
                        <span className="text-sm font-medium">Salary Range:</span>
                        <p className="text-sm mt-1">
                          {generatedJD.aiMetadata.salary.currency} {generatedJD.aiMetadata.salary.min.toLocaleString()} - {generatedJD.aiMetadata.salary.max.toLocaleString()}
                        </p>
                      </div>
                    )}

                    <div>
                      <span className="text-sm font-medium">Experience:</span>
                      <p className="text-sm mt-1">{generatedJD.aiMetadata.experience}</p>
                    </div>

                    <div>
                      <span className="text-sm font-medium">Location:</span>
                      <p className="text-sm mt-1">{generatedJD.aiMetadata.location}</p>
                    </div>
                  </div>
                )}

                <Button className="w-full mt-4" onClick={() => navigate('/dashboard/jd')}>
                  View in JD List
                </Button>
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">
                  Fill in the prompt and click generate to see the AI-generated job description
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
