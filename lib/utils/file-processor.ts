import * as XLSX from "xlsx";
import ExcelJS from "exceljs";

export interface CompanyInput {
  company: string;
  address: string;
}

export interface CompanyOutput extends CompanyInput {
  latestPermitDate: string | null;
  permitPageLink: string | null;
  status: string;
  errorMessage?: string;
  steps?: Array<{
    step: string;
    status: "success" | "error" | "pending";
    message?: string;
    timestamp: Date;
  }>;
}

export async function parseInputFile(file: File): Promise<CompanyInput[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

  // Find header row
  let headerRowIndex = 0;
  let companyColIndex = -1;
  let addressColIndex = -1;

  for (let i = 0; i < Math.min(5, data.length); i++) {
    const row = data[i];
    for (let j = 0; j < row.length; j++) {
      const cell = String(row[j] || "").toLowerCase().trim();
      if (cell.includes("entreprise") || cell.includes("company") || cell.includes("nom")) {
        companyColIndex = j;
        headerRowIndex = i;
      }
      if (cell.includes("ville") || cell.includes("city") || cell.includes("adresse") || cell.includes("address")) {
        addressColIndex = j;
        headerRowIndex = i;
      }
    }
    if (companyColIndex !== -1 && addressColIndex !== -1) break;
  }

  if (companyColIndex === -1 || addressColIndex === -1) {
    throw new Error("Could not find 'Company' and 'Address' columns in the file");
  }

  const companies: CompanyInput[] = [];

  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i];
    const company = String(row[companyColIndex] || "").trim();
    const address = String(row[addressColIndex] || "").trim();

    if (company && address) {
      companies.push({ company, address });
    }
  }

  return companies;
}

export async function generateOutputFile(results: CompanyOutput[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Results");

  // Add headers
  worksheet.columns = [
    { header: "Company", key: "company", width: 30 },
    { header: "Address", key: "address", width: 40 },
    { header: "Latest Delivered Permit Date", key: "latestPermitDate", width: 25 },
    { header: "Permit Page Link", key: "permitPageLink", width: 60 },
    { header: "Status", key: "status", width: 20 },
    { header: "Error Message", key: "errorMessage", width: 40 },
  ];

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  };

  // Add data
  results.forEach((result) => {
    worksheet.addRow({
      company: result.company,
      address: result.address,
      latestPermitDate: result.latestPermitDate || "",
      permitPageLink: result.permitPageLink || "",
      status: result.status,
      errorMessage: result.errorMessage || "",
    });
  });

  // Style status column based on status value
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      const statusCell = row.getCell(5);
      const status = statusCell.value as string;

      if (status === "SUCCESS") {
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF90EE90" },
        };
      } else if (status === "ERROR") {
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFB6C1" },
        };
      } else if (status === "NO_PERMIT_DATA") {
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFE4B5" },
        };
      }
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

