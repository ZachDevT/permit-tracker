"use client";

import { useState, useCallback, useEffect } from "react";
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, Clock, Download, BarChart3, Zap } from "lucide-react";
import { FileUpload } from "@/components/FileUpload";
import { JobProgress } from "@/components/JobProgress";
import { ResultsTable } from "@/components/ResultsTable";
import { StatsCard } from "@/components/StatsCard";
import { ScrapingSteps } from "@/components/ScrapingSteps";

export default function Home() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [isPolling, setIsPolling] = useState(false);

  const pollJobStatus = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/jobs?jobId=${id}`);
      const data = await response.json();
      setJobStatus(data);

      if (data.status === "processing") {
        setIsPolling(true);
      } else {
        setIsPolling(false);
      }
    } catch (error) {
      console.error("Error polling job status:", error);
      setIsPolling(false);
    }
  }, []);

  useEffect(() => {
    if (jobId && isPolling) {
      const interval = setInterval(() => {
        pollJobStatus(jobId);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [jobId, isPolling, pollJobStatus]);

  const handleFileUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/jobs", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to start job");
      }

      const data = await response.json();
      setJobId(data.jobId);
      setIsPolling(true);
      pollJobStatus(data.jobId);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error uploading file. Please try again.");
    }
  };

  const handleDownload = () => {
    if (jobId) {
      window.open(`/api/jobs/download?jobId=${jobId}`, "_blank");
    }
  };

  const stats = jobStatus?.results
    ? {
        total: jobStatus.total || 0,
        processed: jobStatus.processed || 0,
        success: jobStatus.results.filter((r: any) => r.status === "SUCCESS").length,
        errors: jobStatus.results.filter((r: any) => r.status === "ERROR").length,
        noData: jobStatus.results.filter((r: any) => r.status === "NO_PERMIT_DATA").length,
      }
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl mb-4 shadow-lg">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
            Permit Tracker
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
            Automated extraction of environmental permit dates from BDES portal
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Version 1.0.0 - Production Ready
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 animate-slide-up">
            <StatsCard
              title="Total"
              value={stats.total}
              icon={FileSpreadsheet}
              color="blue"
            />
            <StatsCard
              title="Processed"
              value={stats.processed}
              icon={Clock}
              color="purple"
            />
            <StatsCard
              title="Success"
              value={stats.success}
              icon={CheckCircle2}
              color="green"
            />
            <StatsCard
              title="Errors"
              value={stats.errors}
              icon={XCircle}
              color="red"
            />
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Upload & Progress */}
          <div className="lg:col-span-1 space-y-6">
            {!jobId ? (
              <FileUpload onFileSelect={handleFileUpload} />
            ) : (
              <>
                <JobProgress
                  jobStatus={jobStatus}
                  onDownload={handleDownload}
                />
                {jobStatus && (
                  <ScrapingSteps
                    steps={jobStatus.results?.[jobStatus.results.length - 1]?.steps}
                    currentStep={jobStatus.currentStep}
                    currentStepStatus={jobStatus.currentStepStatus}
                    currentStepMessage={jobStatus.currentStepMessage}
                  />
                )}
              </>
            )}
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-2">
            {jobStatus?.results && jobStatus.results.length > 0 ? (
              <ResultsTable results={jobStatus.results} />
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 text-center">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {jobId ? "Processing..." : "Upload a file to get started"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

