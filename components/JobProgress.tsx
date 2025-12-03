"use client";

import { Download, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface JobProgressProps {
  jobStatus: any;
  onDownload: () => void;
}

export function JobProgress({ jobStatus, onDownload }: JobProgressProps) {
  const progress = jobStatus?.total
    ? Math.round((jobStatus.processed / jobStatus.total) * 100)
    : 0;

  const getStatusIcon = () => {
    switch (jobStatus?.status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "processing":
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (jobStatus?.status) {
      case "completed":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "processing":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Job Status
        </h2>
        {getStatusIcon()}
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">Progress</span>
            <span className="text-gray-900 dark:text-white font-medium">
              {jobStatus?.processed || 0} / {jobStatus?.total || 0}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-300 ease-out",
                getStatusColor()
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {jobStatus?.currentCompany && (
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            <span className="font-medium">Processing:</span>{" "}
            {jobStatus.currentCompany}
          </div>
        )}

        {jobStatus?.currentStep && (
          <div className="text-xs text-gray-500 dark:text-gray-500 mb-2">
            <span className="font-medium">Current Step:</span>{" "}
            <span className={jobStatus.currentStepStatus === "error" ? "text-red-500" : jobStatus.currentStepStatus === "success" ? "text-green-500" : "text-blue-500"}>
              {jobStatus.currentStep}
            </span>
            {jobStatus.currentStepMessage && (
              <span className="ml-2 text-gray-400">({jobStatus.currentStepMessage})</span>
            )}
          </div>
        )}

        {jobStatus?.status === "completed" && (
          <button
            onClick={onDownload}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Results
          </button>
        )}

        {jobStatus?.error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              {jobStatus.error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

