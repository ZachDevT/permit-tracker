const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

// Import API route handlers
// Note: For production, you'd want to properly structure this
// For now, we'll create a simple proxy to handle API routes

exports.api = onRequest(
  {
    timeoutSeconds: 540,
    memory: "2GiB",
    cors: true,
  },
  async (req, res) => {
    // Set CORS headers
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    const path = req.path.replace("/api/", "");

    try {
      if (path === "jobs" && req.method === "POST") {
        // Handle job creation
        const { BDESScraper } = require("./scraper");
        const { parseInputFile, generateOutputFile } = require("./file-processor");

        const formData = req.body;
        const file = formData.file;

        if (!file) {
          return res.status(400).json({ error: "No file provided" });
        }

        const companies = await parseInputFile(file);

        if (companies.length === 0) {
          return res.status(400).json({ error: "No companies found in file" });
        }

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

        return res.json({ jobId });
      } else if (path === "jobs" && req.method === "GET") {
        // Handle job status
        const jobId = req.query.jobId;

        if (!jobId) {
          return res.status(400).json({ error: "Job ID required" });
        }

        const jobDoc = await db.collection("jobs").doc(jobId).get();

        if (!jobDoc.exists) {
          return res.status(404).json({ error: "Job not found" });
        }

        const jobData = jobDoc.data();

        return res.json({
          jobId,
          status: jobData?.status,
          total: jobData?.total,
          processed: jobData?.processed,
          currentCompany: jobData?.currentCompany,
          results: jobData?.results || [],
          error: jobData?.error,
          createdAt: jobData?.createdAt?.toDate?.()?.toISOString(),
          completedAt: jobData?.completedAt?.toDate?.()?.toISOString(),
        });
      } else if (path.startsWith("jobs/download") && req.method === "GET") {
        // Handle file download
        const jobId = req.query.jobId;

        if (!jobId) {
          return res.status(400).json({ error: "Job ID required" });
        }

        const jobDoc = await db.collection("jobs").doc(jobId).get();

        if (!jobDoc.exists) {
          return res.status(404).json({ error: "Job not found" });
        }

        const jobData = jobDoc.data();

        if (jobData?.status !== "completed" || !jobData?.outputFile) {
          return res
            .status(400)
            .json({ error: "Job not completed or output not available" });
        }

        const buffer = Buffer.from(jobData.outputFile, "base64");

        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="permit-results-${jobId}.xlsx"`
        );

        return res.send(buffer);
      } else {
        return res.status(404).json({ error: "Not found" });
      }
    } catch (error) {
      console.error("API error:", error);
      return res.status(500).json({ error: error.message });
    }
  }
);

async function processJob(jobId, companies) {
  const jobRef = db.collection("jobs").doc(jobId);
  const { BDESScraper } = require("./scraper");
  const { generateOutputFile } = require("./file-processor");
  const scraper = new BDESScraper();

  try {
    await scraper.initialize();
    const results = [];

    for (let i = 0; i < companies.length; i++) {
      const { company, address } = companies[i];

      await jobRef.update({
        processed: i + 1,
        currentCompany: company,
        updatedAt: new Date(),
      });

      const result = await scraper.scrapePermit(company, address);
      results.push(result);

      await jobRef.update({
        results: results,
        updatedAt: new Date(),
      });

      if (i < companies.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    const outputBuffer = await generateOutputFile(results);
    const outputBase64 = outputBuffer.toString("base64");

    await jobRef.update({
      status: "completed",
      processed: companies.length,
      outputFile: outputBase64,
      completedAt: new Date(),
      updatedAt: new Date(),
    });
  } catch (error) {
    await jobRef.update({
      status: "error",
      error: error.message,
      updatedAt: new Date(),
    });
  } finally {
    await scraper.close();
  }
}

