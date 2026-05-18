import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { AuthLayout } from "./layouts/AuthLayout";
import { ProtectedRoute } from "./router/ProtectedRoute";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Overview from "./pages/dashboard/Overview";
import JDList from "./pages/dashboard/jd/JDList";
import CreateJD from "./pages/dashboard/jd/CreateJD";
import JDPost from "./pages/dashboard/jd/JDPost";
import CandidateList from "./pages/dashboard/resume/CandidateList";
import AssessmentList from "./pages/dashboard/assessment/AssessmentList";
import AssessmentDetail from "./pages/dashboard/assessment/AssessmentDetail";
import InterviewList from "./pages/dashboard/interview/InterviewList";
import OfferList from "./pages/dashboard/offer/OfferList";
import CandidateDashboard from "./pages/candidate/CandidateDashboard";
import TestScreen from "./pages/candidate/TestScreen";
import NotFound from "./pages/NotFound";
import JDDetail from "./pages/dashboard/jd/JDDetail";
import ApplyJobPage from "./pages/application/ApplyJobPage";
import HuriaPage from "./pages/VoiceBot/VoiceInput";

// ── New Feature Pages ───────────────────────────────────────────────────────
import MyLeaves from "./pages/dashboard/leave/MyLeaves";
import LeaveManagement from "./pages/dashboard/leave/LeaveManagement";
import AnalyticsDashboard from "./pages/dashboard/analytics/AnalyticsDashboard";
import ProjectList from "./pages/dashboard/projects/ProjectList";
import ProjectDetail from "./pages/dashboard/projects/ProjectDetail";
import MailLog from "./pages/dashboard/mail/MailLog";

import { useInitializeAuth } from "./hooks/useInitializeAuth";

import CandidateLogin from "./pages/auth/CandidateLogin";

const queryClient = new QueryClient();

const AppContent = () => {
  useInitializeAuth();
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/apply/:jdId" element={<ApplyJobPage />} />
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="candidate" element={<CandidateLogin />} />
          <Route path="register" element={<Register />} />
        </Route>

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Overview />} />
              {/* Huria AI Assistant */}
              <Route path="huria" element={<HuriaPage />} />
              
              {/* Restricted Hiring Pipeline (HR/Admin Only) */}
              <Route element={<ProtectedRoute allowedRoles={['hr', 'admin']} />}>
                <Route path="jd" element={<JDList />} />
                <Route path="jd/:id" element={<JDDetail />} />
                <Route path="jd/:id/post" element={<JDPost />} />
                <Route path="jd/create" element={<CreateJD />} />
                <Route path="resume" element={<CandidateList />} />
                <Route path="assessment" element={<AssessmentList />} />
                <Route path="assessment/:id" element={<AssessmentDetail />} />
                {/* <Route path="interview" element={<InterviewList />} />
                <Route path="offer" element={<OfferList />} /> */}
                <Route path="leave" element={<LeaveManagement />} />
                <Route path="analytics" element={<AnalyticsDashboard />} />
                <Route path="mail-log" element={<MailLog />} />
              </Route>

              {/* General Workforce (All authenticated users) */}
              <Route path="my-leaves" element={<MyLeaves />} />
              <Route path="projects" element={<ProjectList />} />
              <Route path="projects/:id" element={<ProjectDetail />} />
            </Route>

            <Route
              path="/candidate"
              element={
                <ProtectedRoute allowedRoles={['candidate']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<CandidateDashboard />} />
              <Route path="tests/:testId" element={<TestScreen />} />
              <Route path="my-leaves" element={<MyLeaves />} />
              <Route path="interviews" element={<div className="p-8">My Interviews — Coming Soon</div>} />
              <Route path="offers" element={<div className="p-8">My Offers — Coming Soon</div>} />
              <Route path="onboarding" element={<div className="p-8">Onboarding — Coming Soon</div>} />
            </Route>

            <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  </Provider>
);

export default App;
