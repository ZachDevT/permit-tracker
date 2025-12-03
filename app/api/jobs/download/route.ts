import { NextRequest, NextResponse } from "next/server";
import { initializeFirebaseAdmin } from "@/lib/firebase/admin";

// Mark as dynamic route
export const dynamic = 'force-dynamic';

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

    if (jobData?.status !== "completed" || !jobData?.outputFile) {
      return NextResponse.json({ error: "Job not completed or output not available" }, { status: 400 });
    }

    const buffer = Buffer.from(jobData.outputFile, "base64");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="permit-results-${jobId}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error("Error downloading file:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

