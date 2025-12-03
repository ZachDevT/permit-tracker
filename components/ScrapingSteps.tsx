"use client";

import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ScrapingStep } from "@/lib/types/scraping";

interface ScrapingStepsProps {
  steps?: ScrapingStep[];
  currentStep?: string;
  currentStepStatus?: string;
  currentStepMessage?: string;
}

export function ScrapingSteps({ steps, currentStep, currentStepStatus, currentStepMessage }: ScrapingStepsProps) {
  const getStepIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "pending":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-600 dark:text-green-400";
      case "error":
        return "text-red-600 dark:text-red-400";
      case "pending":
        return "text-blue-600 dark:text-blue-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  // Combine steps from result with current step
  const allSteps = steps || [];
  if (currentStep && !allSteps.find(s => s.step === currentStep)) {
    allSteps.push({
      step: currentStep,
      status: (currentStepStatus as "success" | "error" | "pending") || "pending",
      message: currentStepMessage,
      timestamp: new Date(),
    });
  }

  if (allSteps.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Scraping Steps
      </h3>
      <div className="space-y-2">
        {allSteps.map((step, index) => (
          <div
            key={index}
            className={cn(
              "flex items-start gap-3 p-2 rounded-lg transition-colors",
              step.status === "error" && "bg-red-50 dark:bg-red-900/20",
              step.status === "success" && "bg-green-50 dark:bg-green-900/20",
              step.status === "pending" && "bg-blue-50 dark:bg-blue-900/20"
            )}
          >
            <div className="mt-0.5">
              {getStepIcon(step.status)}
            </div>
            <div className="flex-1 min-w-0">
              <div className={cn("text-sm font-medium", getStepColor(step.status))}>
                {step.step}
              </div>
              {step.message && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {step.message}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

