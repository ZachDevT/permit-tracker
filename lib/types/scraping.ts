export interface ScrapingStep {
  step: string;
  status: "success" | "error" | "pending";
  message?: string;
  timestamp: Date;
}

export interface PermitResult {
  company: string;
  address: string;
  latestPermitDate: string | null;
  permitPageLink: string | null;
  status: "SUCCESS" | "ADDRESS_NOT_FOUND" | "MULTIPLE_PARCELS" | "NO_PERMIT_DATA" | "ERROR";
  errorMessage?: string;
  steps?: ScrapingStep[];
}

