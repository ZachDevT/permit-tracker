import { NextRequest, NextResponse } from "next/server";
import { initializeFirebaseAdmin } from "@/lib/firebase/admin";
import { BDESScraper } from "@/lib/scraper/bdes-scraper";
import { PermitResult } from "@/lib/types/scraping";
import { parseInputFile, generateOutputFile, CompanyInput, CompanyOutput } from "@/lib/utils/file-processor";

// Mark as dynamic route
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { db } = initializeFirebaseAdmin();
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Parse input file
    const companies = await parseInputFile(file);

    if (companies.length === 0) {
      return NextResponse.json({ error: "No companies found in file" }, { status: 400 });
    }

    // Create job document
    const jobRef = db.collection("jobs").doc();
    const jobId = jobRef.id;

    await jobRef.set({
      status: "processing",
      total: companies.length,
      processed: 0,
      results: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Start processing in background
    processJob(jobId, companies).catch((error) => {
      console.error("Job processing error:", error);
      jobRef.update({
        status: "error",
        error: error.message,
        updatedAt: new Date(),
      });
    });

    return NextResponse.json({ jobId });
  } catch (error: any) {
    console.error("Error creating job:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function processJob(jobId: string, companies: CompanyInput[]) {
  const { db } = initializeFirebaseAdmin();
  const jobRef = db.collection("jobs").doc(jobId);
  const scraper = new BDESScraper();

  try {
    await scraper.initialize();
    const results: CompanyOutput[] = [];

    for (let i = 0; i < companies.length; i++) {
      const { company, address } = companies[i];
      
      // Update progress
      await jobRef.update({
        processed: i + 1,
        currentCompany: company,
        updatedAt: new Date(),
      });

      // Scrape permit data with step updates
      const result = await scraper.scrapePermit(company, address, async (step) => {
        // Update job with current step - ensure no undefined values
        await jobRef.update({
          currentStep: step.step || "",
          currentStepStatus: step.status || "pending",
          currentStepMessage: step.message || "",
          updatedAt: new Date(),
        });
      });
      
      // Clean result to remove undefined values from steps
      const cleanedResult = {
        ...result,
        steps: result.steps?.map(step => ({
          ...step,
          message: step.message || "",
        })) || [],
      };
      
      results.push(cleanedResult);
      
      // Update results
      await jobRef.update({
        results: results.map(r => ({
          ...r,
          steps: r.steps?.map(step => ({
            ...step,
            message: step.message || "",
          })) || [],
        })),
        updatedAt: new Date(),
      });

      // Delay between requests
      if (i < companies.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    // Generate output file
    const outputBuffer = await generateOutputFile(results);
    const outputBase64 = outputBuffer.toString("base64");

    // Update job as completed
    await jobRef.update({
      status: "completed",
      processed: companies.length,
      outputFile: outputBase64,
      completedAt: new Date(),
      updatedAt: new Date(),
    });
  } catch (error: any) {
    await jobRef.update({
      status: "error",
      error: error.message,
      updatedAt: new Date(),
    });
  } finally {
    await scraper.close();
  }
}

export async function GET(request: NextRequest) {
  try {
    const { db } = initializeFirebaseAdmin();
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json({ error: "Job ID required" }, { status: 400 });
    }

    const jobDoc = await db.collection("jobs").doc(jobId).get();

    if (!jobDoc.exists) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const jobData = jobDoc.data();

    return NextResponse.json({
      jobId,
      status: jobData?.status,
      total: jobData?.total,
      processed: jobData?.processed,
      currentCompany: jobData?.currentCompany,
      currentStep: jobData?.currentStep,
      currentStepStatus: jobData?.currentStepStatus,
      currentStepMessage: jobData?.currentStepMessage,
      results: jobData?.results || [],
      error: jobData?.error,
      createdAt: jobData?.createdAt?.toDate?.()?.toISOString(),
      completedAt: jobData?.completedAt?.toDate?.()?.toISOString(),
    });
  } catch (error: any) {
    console.error("Error fetching job:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

