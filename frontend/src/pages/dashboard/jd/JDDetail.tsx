import { useLocation, useNavigate } from "react-router-dom";

interface AiMetadata {
  shortSummary: string;
  highlights: string[];
  hashtags: string[];
}

interface AiResponse {
  jobTitle: string;
  company: string;
  location: string;
  employmentType: string;
  skills: string[];
  experience: string;
  salaryRange: string;
  aiMetadata: AiMetadata;
}

interface JobData {
  _id: string;
  userId: string;
  prompt: string;
  status: string;
  approvalStatus: string;
  createdAt: string;
  updatedAt: string;
  aiResponse: AiResponse;
}

const JobDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const job = location.state as JobData | undefined;

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold">No job data found</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-black text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { aiResponse } = job;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <h1 className="text-3xl font-bold">{aiResponse.jobTitle}</h1>
          <p className="mt-1 text-sm opacity-90">
            {aiResponse.company} • {aiResponse.location}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">

          {/* Summary */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Overview</h2>
            <p className="text-gray-700">
              {aiResponse.aiMetadata.shortSummary}
            </p>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoCard label="Employment Type" value={aiResponse.employmentType} />
            <InfoCard label="Experience" value={aiResponse.experience} />
            <InfoCard label="Salary Range" value={aiResponse.salaryRange} />
            <InfoCard label="Approval Status" value={job.approvalStatus} />
          </div>

          {/* Skills */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Required Skills</h2>
            <div className="flex flex-wrap gap-2">
              {(aiResponse.skills || []).map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Highlights */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Key Highlights</h2>
            <ul className="list-disc list-inside text-gray-700">
              {(aiResponse.aiMetadata?.highlights || []).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Hashtags */}
          <div className="flex flex-wrap gap-2">
            {(aiResponse.aiMetadata?.hashtags || []).map((tag, index) => (
              <span
                key={index}
                className="text-sm text-purple-600 font-medium"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-gray-500">
              Posted on {new Date(job.createdAt).toLocaleDateString()}
            </p>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoCard = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-gray-100 rounded-lg p-4">
    <p className="text-xs text-gray-500">{label}</p>
    <p className="font-semibold mt-1">{value}</p>
  </div>
);

export default JobDetails;
