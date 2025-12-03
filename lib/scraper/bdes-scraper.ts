import { chromium, Browser, Page } from "playwright";

export interface PermitResult {
  company: string;
  address: string;
  latestPermitDate: string | null;
  permitPageLink: string | null;
  status: "SUCCESS" | "ADDRESS_NOT_FOUND" | "MULTIPLE_PARCELS" | "NO_PERMIT_DATA" | "ERROR";
  errorMessage?: string;
}

export class BDESScraper {
  private browser: Browser | null = null;
  private readonly BASE_URL = "https://bdes.spw.wallonie.be/portal/web/guest/app/-/consultation/carte";
  private readonly TIMEOUT = 30000;

  async initialize(): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async scrapePermit(company: string, address: string): Promise<PermitResult> {
    const result: PermitResult = {
      company,
      address,
      latestPermitDate: null,
      permitPageLink: null,
      status: "ERROR",
    };

    if (!this.browser) {
      await this.initialize();
    }

    const context = await this.browser!.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    });

    const page = await context.newPage();

    try {
      // Navigate to the BDES map
      await page.goto(this.BASE_URL, { waitUntil: "networkidle", timeout: this.TIMEOUT });

      // Wait for the search field to be available
      await page.waitForSelector('input[type="text"], input[placeholder*="rue"], input[placeholder*="adresse"]', {
        timeout: 10000,
      });

      // Find and fill the search input
      const searchInput = await page.locator('input[type="text"]').first();
      await searchInput.fill(address);
      await page.waitForTimeout(1000);

      // Press Enter or click search button
      await searchInput.press("Enter");
      await page.waitForTimeout(2000);

      // Wait for map to load and look for stethoscope icon or parcel markers
      await page.waitForTimeout(3000);

      // Look for stethoscope icon (medical cross icon) or parcel identification tool
      const stethoscopeSelector = 'button[title*="identification"], button[aria-label*="identification"], .leaflet-control-identify, [class*="identify"], [class*="stethoscope"]';
      
      // Try to find and click the stethoscope/identify button
      const identifyButton = page.locator(stethoscopeSelector).first();
      const buttonCount = await identifyButton.count();

      if (buttonCount === 0) {
        // Alternative: look for clickable parcels on the map
        // Click on the map area where parcels might be
        const mapContainer = page.locator('.leaflet-container, [class*="map"], [id*="map"]').first();
        
        if (await mapContainer.count() > 0) {
          // Get map bounds and click center
          const mapBox = await mapContainer.boundingBox();
          if (mapBox) {
            await page.mouse.click(mapBox.x + mapBox.width / 2, mapBox.y + mapBox.height / 2);
            await page.waitForTimeout(2000);
          }
        } else {
          result.status = "ADDRESS_NOT_FOUND";
          result.errorMessage = "Could not find map or identification tool";
          return result;
        }
      } else {
        await identifyButton.click();
        await page.waitForTimeout(1000);
      }

      // Wait for parcel popup or identification results
      await page.waitForTimeout(2000);

      // Look for parcel name/link in popup or results panel
      const parcelLinkSelector = 'a[href*="parcelle"], .parcel-name, [class*="parcel"], [data-parcel]';
      const parcelLinks = page.locator(parcelLinkSelector);

      const parcelCount = await parcelLinks.count();

      if (parcelCount === 0) {
        // Try alternative selectors for parcel information
        const altSelectors = [
          'text=/parcelle/i',
          '[title*="parcelle"]',
          '.result-item',
          '[class*="result"]',
        ];

        let found = false;
        for (const selector of altSelectors) {
          const elements = page.locator(selector);
          if (await elements.count() > 0) {
            found = true;
            await elements.first().click();
            await page.waitForTimeout(2000);
            break;
          }
        }

        if (!found) {
          result.status = "ADDRESS_NOT_FOUND";
          result.errorMessage = "No parcels found for this address";
          return result;
        }
      } else if (parcelCount === 1) {
        await parcelLinks.first().click();
        await page.waitForTimeout(2000);
      } else {
        // Multiple parcels found - click the first one or handle differently
        await parcelLinks.first().click();
        await page.waitForTimeout(2000);
        result.status = "MULTIPLE_PARCELS";
      }

      // Get the current URL (parcel information page)
      const currentUrl = page.url();
      result.permitPageLink = currentUrl;

      // Wait for the page to load
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      // Look for "Procédures" tab
      const proceduresTabSelector = 'button:has-text("Procédures"), a:has-text("Procédures"), [role="tab"]:has-text("Procédures"), [class*="tab"]:has-text("Procédures")';
      const proceduresTab = page.locator(proceduresTabSelector).first();

      if (await proceduresTab.count() === 0) {
        result.status = "NO_PERMIT_DATA";
        result.errorMessage = "Procédures tab not found";
        return result;
      }

      await proceduresTab.click();
      await page.waitForTimeout(2000);

      // Wait for the procedures table to load
      await page.waitForSelector('table, [class*="table"], [role="table"]', { timeout: 10000 });

      // Extract permit data from the table
      const table = page.locator('table, [class*="table"], [role="table"]').first();
      
      // Find all rows (skip header row)
      const rows = table.locator('tbody tr, [role="row"]:not(:first-child)');
      const rowCount = await rows.count();

      let latestDate: string | null = null;
      let latestDateObj: Date | null = null;

      // Find column indices for "Date de début" and "Statut"
      const headerRow = table.locator('thead tr, tr:first-child, [role="row"]:first-child').first();
      const headerCells = headerRow.locator('th, td, [role="columnheader"]');
      const headerCount = await headerCells.count();
      
      let dateColIndex = -1;
      let statusColIndex = -1;

      for (let h = 0; h < headerCount; h++) {
        const headerText = await headerCells.nth(h).textContent();
        const normalizedHeader = headerText?.toLowerCase().trim() || "";
        
        if (normalizedHeader.includes("date de début") || normalizedHeader.includes("date de debut")) {
          dateColIndex = h;
        }
        if (normalizedHeader.includes("statut") || normalizedHeader.includes("status")) {
          statusColIndex = h;
        }
      }

      // If we found column indices, use them; otherwise fall back to text matching
      if (dateColIndex !== -1 && statusColIndex !== -1) {
        // Use column-based extraction (more accurate)
        for (let i = 0; i < rowCount; i++) {
          const row = rows.nth(i);
          const cells = row.locator('td, [role="gridcell"]');
          
          const statusCell = cells.nth(statusColIndex);
          const statusText = await statusCell.textContent();
          
          if (statusText && statusText.trim().includes("Permis délivré")) {
            const dateCell = cells.nth(dateColIndex);
            const dateText = await dateCell.textContent();
            
            if (dateText) {
              const dateMatch = dateText.trim().match(/(\d{2}\/\d{2}\/\d{4})/);
              if (dateMatch) {
                const dateStr = dateMatch[0];
                const [day, month, year] = dateStr.split("/").map(Number);
                const dateObj = new Date(year, month - 1, day);

                if (!latestDateObj || dateObj > latestDateObj) {
                  latestDateObj = dateObj;
                  latestDate = dateStr;
                }
              }
            }
          }
        }
      } else {
        // Fallback: text-based extraction
        for (let i = 0; i < rowCount; i++) {
          const row = rows.nth(i);
          const rowText = await row.textContent();
          
          if (rowText && rowText.includes("Permis délivré")) {
            // Extract date from the row - look for "Date de début" pattern
            // The date should be in the same row, typically in DD/MM/YYYY format
            const dateMatch = rowText.match(/(\d{2}\/\d{2}\/\d{4})/g);
            
            if (dateMatch && dateMatch.length > 0) {
              // Get the first date (Date de début) - usually the first date in the row
              const dateStr = dateMatch[0];
              const [day, month, year] = dateStr.split("/").map(Number);
              const dateObj = new Date(year, month - 1, day);

              if (!latestDateObj || dateObj > latestDateObj) {
                latestDateObj = dateObj;
                latestDate = dateStr;
              }
            }
          }
        }
      }

      if (latestDate) {
        result.latestPermitDate = latestDate;
        result.status = "SUCCESS";
      } else {
        result.status = "NO_PERMIT_DATA";
        result.errorMessage = "No 'Permis délivré' entries found";
      }
    } catch (error: any) {
      console.error(`Error scraping permit for ${company}:`, error);
      result.status = "ERROR";
      result.errorMessage = error.message || "Unknown error occurred";
    } finally {
      await context.close();
    }

    return result;
  }

  async scrapeBatch(companies: Array<{ company: string; address: string }>, onProgress?: (progress: number, current: string) => void): Promise<PermitResult[]> {
    const results: PermitResult[] = [];
    const total = companies.length;

    await this.initialize();

    for (let i = 0; i < companies.length; i++) {
      const { company, address } = companies[i];
      
      if (onProgress) {
        onProgress(((i + 1) / total) * 100, company);
      }

      const result = await this.scrapePermit(company, address);
      results.push(result);

      // Add delay between requests to avoid overwhelming the server
      if (i < companies.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    return results;
  }
}

