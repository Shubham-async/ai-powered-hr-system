import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
const ApplyJobPage = () => {
  const { jdId } = useParams(); // Get job_id from URL
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please upload a resume");

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('job_id', jdId);

    try {
      setUploading(true);
      const response = await axiosClient.post('/apply', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("Applied successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to apply.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Submit Your Application</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2 text-sm font-medium">Upload Resume (PDF)</label>
          <input 
            type="file" 
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx"
            className="block w-full text-sm border border-gray-300 rounded-lg cursor-pointer"
          />
        </div>
        <button 
          type="submit" 
          disabled={uploading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {uploading ? "Submitting..." : "Apply Now"}
        </button>
      </form>
    </div>
  );
};

export default ApplyJobPage;