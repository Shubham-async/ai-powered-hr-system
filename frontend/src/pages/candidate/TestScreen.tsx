import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Clock, ChevronLeft, ChevronRight, Send, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/shared/Loader";
import { ErrorState } from "@/components/shared/ErrorState";
import { assessmentApi } from "@/api/assessmentApi";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";

export default function TestScreen() {
  const navigate = useNavigate();
  const { testId } = useParams<{ testId: string }>();
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes in seconds
  const [testStarted, setTestStarted] = useState(false);

  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ['assessment-test', testId],
    queryFn: () => testId ? assessmentApi.getTestByTestId(testId) : Promise.reject(new Error('No test ID')),
    enabled: !!testId,
  });

  const test = response?.test;  const submitMutation = useMutation({
    mutationFn: (formattedAnswers: Array<{ question_id: string; answer: string }>) =>
      assessmentApi.submit({
        test_id: test._id,
        responses: formattedAnswers,
      }),
    onSuccess: () => {
      toast.success("Assessment submitted successfully!");
      setTimeout(() => navigate('/dashboard'), 1500);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to submit assessment");
    },
  });

  useEffect(() => {
    if (!test || !testStarted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [test, testStarted]);

  const handleSubmit = () => {
    if (!test) return;

    const formattedAnswers = test.questions.map((q) => ({
      question_id: q.question_id,
      answer: answers[q.question_id] || '',
    }));

    submitMutation.mutate(formattedAnswers);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!testId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold">Invalid Access</h2>
        <p className="text-muted-foreground">No test ID provided</p>
        <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
      </div>
    );
  }

  if (isLoading) return <Loader size="lg" text="Loading assessment..." />;
  if (error) return <ErrorState message="Failed to load assessment" retry={refetch} />;
  if (!test) return <ErrorState message="No test found" retry={refetch} />;

  const question = test.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / test.questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div>
      <PageHeader
        title={`${test.test_type} Assessment`}
        description="Answer all questions to complete the test"
      />

      {!testStarted && (
        <Card className="mb-6 border-info bg-info/5">
          <CardHeader>
            <CardTitle className="text-info">Test Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium mb-2">Test Details:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Total Questions: <strong>{test.questions.length}</strong></li>
                <li>Total Marks: <strong>{test.total_marks}</strong></li>
                <li>Duration: <strong>{test.duration_minutes || 60} minutes</strong></li>
                <li>Type: <strong>{test.test_type}</strong></li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">Guidelines:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Answer all questions carefully</li>
                <li>You can navigate between questions using Previous/Next buttons</li>
                <li>Timer will automatically submit when time ends</li>
                <li>Cannot modify answers after submission</li>
              </ul>
            </div>
            <Button onClick={() => setTestStarted(true)} className="w-full">
              Start Test
            </Button>
          </CardContent>
        </Card>
      )}

      {testStarted && (
        <>
          <div className="grid gap-6 md:grid-cols-3 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Time Remaining</p>
                    <p className="text-2xl font-bold flex items-center gap-2">
                      <Clock className="h-5 w-5 text-warning" />
                      {formatTime(timeLeft)}
                    </p>
                  </div>
                  {timeLeft < 300 && (
                    <Badge className="bg-destructive text-destructive-foreground">
                      Hurry!
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-1">Progress</p>
                <div className="flex items-center gap-3">
                  <Progress value={progress} className="flex-1" />
                  <span className="text-sm font-medium">
                    {currentQuestion + 1}/{test.questions.length}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-1">Answered</p>
                <p className="text-2xl font-bold">
                  {answeredCount}/{test.questions.length}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Question {currentQuestion + 1} of {test.questions.length}
                </CardTitle>
                <Badge variant={answers[question.question_id] !== undefined ? "default" : "secondary"}>
                  {answers[question.question_id] !== undefined ? "Answered" : "Not Answered"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose prose-sm max-w-none">
                <p className="text-lg font-medium">{question.question_text}</p>
                {question.marks && (
                  <p className="text-sm text-muted-foreground">Marks: <strong>{question.marks}</strong></p>
                )}
              </div>

              <RadioGroup
                value={answers[question.question_id] || ''}
                onValueChange={(value) =>
                  setAnswers((prev) => ({ ...prev, [question.question_id]: value }))
                }
              >
                <div className="space-y-3">
                  {question.options.map((option, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <Label
                        htmlFor={`option-${index}`}
                        className="flex-1 cursor-pointer font-normal"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>

              <div className="flex items-center justify-between pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
                  disabled={currentQuestion === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                {currentQuestion < test.questions.length - 1 ? (
                  <Button
                    onClick={() =>
                      setCurrentQuestion((prev) =>
                        Math.min(test.questions.length - 1, prev + 1)
                      )
                    }
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={submitMutation.isPending}
                    className="bg-success hover:bg-success/90"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {submitMutation.isPending ? "Submitting..." : "Submit Assessment"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm">Question Navigator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-10 gap-2">
                {test.questions.map((q, index) => (
                  <Button
                    key={index}
                    variant={currentQuestion === index ? "default" : "outline"}
                    size="sm"
                    className={`h-10 ${answers[q.question_id] !== undefined &&
                      currentQuestion !== index
                      ? "bg-success/10 border-success text-success hover:bg-success/20"
                      : ""
                      }`}
                    onClick={() => setCurrentQuestion(index)}
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
