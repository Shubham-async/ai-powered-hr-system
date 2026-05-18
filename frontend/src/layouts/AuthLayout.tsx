import { Outlet } from "react-router-dom";
import { Briefcase } from "lucide-react";

export const AuthLayout = () => {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8">
            <div className="rounded-lg bg-primary p-2">
              <Briefcase className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">HR Portal</span>
          </div>
          <Outlet />
        </div>
      </div>
      
      <div className="hidden lg:block relative bg-gradient-to-br from-primary to-info p-12">
        <div className="h-full flex flex-col justify-center text-primary-foreground">
          <h1 className="text-5xl font-bold mb-6">
            AI-Powered HR Management
          </h1>
          <p className="text-xl opacity-90 mb-8">
            Streamline your hiring process with intelligent automation, from job descriptions to onboarding.
          </p>
          <ul className="space-y-4 text-lg">
            <li className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary-foreground" />
              AI-generated job descriptions
            </li>
            <li className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary-foreground" />
              Smart resume screening
            </li>
            <li className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary-foreground" />
              Automated assessments
            </li>
            <li className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary-foreground" />
              Interview management
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
