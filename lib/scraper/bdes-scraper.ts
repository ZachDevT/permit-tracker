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
      await page.waitForTimeout(2000);

      // Step 1: Handle "Informations et conditions d'utilisation" modal
      // Wait a bit for modals to appear
      await page.waitForTimeout(3000);

      // Look for the terms and conditions acceptance modal
      try {
        // Method 1: Look for checkbox with "J'ai lu et j'accepte"
        const checkboxSelectors = [
          'input[type="checkbox"]:near(:text("J\'ai lu"))',
          'input[type="checkbox"]:near(:text("accepte"))',
          'label:has-text("J\'ai lu") input[type="checkbox"]',
          '.dijitCheckBox:has-text("J\'ai lu")',
        ];

        for (const selector of checkboxSelectors) {
          try {
            const checkbox = page.locator(selector).first();
            if (await checkbox.count() > 0 && await checkbox.isVisible()) {
              await checkbox.check({ timeout: 2000 });
              await page.waitForTimeout(1000);
              break;
            }
          } catch (e) {
            // Try next selector
          }
        }

        // Method 2: Look for Accept button
        const acceptButtonSelectors = [
          'button:has-text("Accepter")',
          'button:has-text("Accept")',
          '[role="button"]:has-text("Accepter")',
          '.dijitButton:has-text("Accepter")',
          'span:has-text("Accepter"):visible',
        ];

        for (const selector of acceptButtonSelectors) {
          try {
            const acceptButton = page.locator(selector).first();
            if (await acceptButton.count() > 0 && await acceptButton.isVisible()) {
              await acceptButton.click({ timeout: 2000 });
              await page.waitForTimeout(2000);
              break;
            }
          } catch (e) {
            // Try next selector
          }
        }
      } catch (e) {
        // Modal might not be present, continue
        console.log("Terms modal not found or already accepted");
      }

      // Step 2: Handle "Mode d'emploi et conseils d'utilisation" dialog
      // Wait a bit more for the help dialog to appear
      await page.waitForTimeout(2000);

      try {
        // Look for close button (X) in dialog title bar
        const closeButtonSelectors = [
          '.dijitDialogCloseIcon',
          '[class*="dijitDialogClose"]',
          'button[title*="Fermer"]',
          'button[aria-label*="Fermer"]',
          'button[aria-label*="Close"]',
          'span[class*="close"]:visible',
          '.dijitTitleBar .dijitDialogCloseIcon',
        ];

        for (const selector of closeButtonSelectors) {
          try {
            const closeButton = page.locator(selector).first();
            if (await closeButton.count() > 0 && await closeButton.isVisible()) {
              await closeButton.click({ timeout: 2000 });
              await page.waitForTimeout(1500);
              break;
            }
          } catch (e) {
            // Try next selector
          }
        }

        // Alternative: Look for "Fermer" button
        const fermerButton = page.locator('button:has-text("Fermer"), span:has-text("Fermer"):visible').first();
        if (await fermerButton.count() > 0 && await fermerButton.isVisible()) {
          await fermerButton.click({ timeout: 2000 });
          await page.waitForTimeout(1500);
        }
      } catch (e) {
        // Dialog might not be present, continue
        console.log("Help dialog not found or already closed");
      }

      // Step 3: Wait for the search field to be available
      await page.waitForSelector('input[type="text"], input[placeholder*="Adresse"], input[placeholder*="adresse"], input[placeholder*="rue"]', {
        timeout: 15000,
      });
      await page.waitForTimeout(1000);

      // Step 4: Find and fill the search input (address bar)
      const searchInputSelectors = [
        'input[placeholder*="Adresse"]',
        'input[placeholder*="adresse"]',
        'input[type="text"]:visible',
      ];

      let searchInput = null;
      for (const selector of searchInputSelectors) {
        const inputs = page.locator(selector);
        const count = await inputs.count();
        if (count > 0) {
          // Get the first visible input
          for (let i = 0; i < count; i++) {
            const input = inputs.nth(i);
            const isVisible = await input.isVisible();
            if (isVisible) {
              searchInput = input;
              break;
            }
          }
          if (searchInput) break;
        }
      }

      if (!searchInput) {
        searchInput = page.locator('input[type="text"]').first();
      }

      await searchInput.fill(address);
      await page.waitForTimeout(2000);

      // Wait for suggestions to appear and click on the first one
      const suggestionSelectors = [
        '.dijitComboBoxMenu',
        '.dijitMenuItem',
        '[role="option"]',
        '.suggestion',
        'li:has-text("' + address.split(',')[0] + '")',
      ];

      let suggestionClicked = false;
      for (const selector of suggestionSelectors) {
        try {
          const suggestions = page.locator(selector);
          const count = await suggestions.count();
          if (count > 0) {
            await suggestions.first().click();
            await page.waitForTimeout(2000);
            suggestionClicked = true;
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      // If no suggestions, press Enter
      if (!suggestionClicked) {
        await searchInput.press("Enter");
        await page.waitForTimeout(3000);
      }

      // Step 5: Wait for map to load
      await page.waitForTimeout(3000);

      // Step 6: Click the stethoscope icon (medical tool icon) - identification tool
      // The stethoscope icon is in the toolbar above the map
      // Based on the images, it's one of the icons in the toolbar row (usually 6th or 7th icon)
      
      await page.waitForTimeout(3000); // Wait for toolbar to be fully loaded
      
      // First, try to wait for the toolbar to be visible
      try {
        await page.waitForSelector('.dijitToolbar, [class*="toolbar"]', { timeout: 5000 });
      } catch (e) {
        // Toolbar might not have that class, continue anyway
      }
      
      const stethoscopeSelectors = [
        // Look for stethoscope by class names (common patterns)
        '[class*="stethoscope"]',
        '[class*="identify"]',
        '[class*="Identify"]',
        '[class*="identification"]',
        // Look for button with title/aria-label
        'button[title*="identification"]',
        'button[title*="identifier"]',
        'button[aria-label*="identification"]',
        'button[aria-label*="identifier"]',
        // Look in dijit buttons
        '.dijitButton:has([class*="stethoscope"])',
        '.dijitButton:has([class*="identify"])',
        '.dijitButton[title*="identification"]',
        // Look for span with stethoscope icon
        'span[class*="stethoscope"]',
        'span[class*="identify"]',
        // Look for any element with stethoscope in class
        '[class*="myCustomAdvancedIdentifyButton"]',
        // Look in toolbar - try to find by position (usually 6th or 7th icon)
        '.dijitToolbar .dijitButton:nth-child(6)',
        '.dijitToolbar .dijitButton:nth-child(7)',
        // Look for all buttons in toolbar and find the one with stethoscope
        '.dijitToolbar button',
        '.dijitToolbar .dijitButton',
      ];

      let stethoscopeClicked = false;
      
      // Method 1: Try specific selectors
      for (const selector of stethoscopeSelectors) {
        try {
          const elements = page.locator(selector);
          const count = await elements.count();
          
          for (let i = 0; i < count; i++) {
            const element = elements.nth(i);
            const isVisible = await element.isVisible().catch(() => false);
            
            if (isVisible) {
              // Check if this element or its children contain stethoscope-related classes
              const classAttr = await element.getAttribute('class').catch(() => '');
              const titleAttr = await element.getAttribute('title').catch(() => '');
              const ariaLabel = await element.getAttribute('aria-label').catch(() => '');
              
              const combinedText = (classAttr + ' ' + titleAttr + ' ' + ariaLabel).toLowerCase();
              
              if (combinedText.includes('stethoscope') || 
                  combinedText.includes('identify') || 
                  combinedText.includes('identification') ||
                  combinedText.includes('identifier')) {
                await element.click({ timeout: 3000 });
                await page.waitForTimeout(2000);
                stethoscopeClicked = true;
                break;
              }
            }
          }
          
          if (stethoscopeClicked) break;
        } catch (e) {
          // Continue to next selector
        }
      }
      
      // Method 2: Look for all buttons in toolbar and click the one that looks like stethoscope
      if (!stethoscopeClicked) {
        try {
          const toolbarButtons = page.locator('.dijitToolbar button, .dijitToolbar .dijitButton, [class*="toolbar"] button');
          const buttonCount = await toolbarButtons.count();
          
          // The stethoscope is usually one of the later buttons (6th or 7th)
          const buttonsToTry = Math.min(buttonCount, 10);
          
          for (let i = 0; i < buttonsToTry; i++) {
            try {
              const button = toolbarButtons.nth(i);
              if (await button.isVisible()) {
                // Get button info
                const buttonClass = await button.getAttribute('class').catch(() => '');
                const buttonTitle = await button.getAttribute('title').catch(() => '');
                const buttonText = await button.textContent().catch(() => '');
                
                // Check if it might be the stethoscope (usually has no text, just an icon)
                if ((!buttonText || buttonText.trim() === '') && ((buttonClass && buttonClass.includes('Button')) || buttonTitle)) {
                  // Try clicking it - if it's the stethoscope, results panel should appear
                  await button.click({ timeout: 2000 });
                  await page.waitForTimeout(3000);
                  
                  // Check if identification results appeared
                  const resultsCheck = page.locator('text=/RÉSULTAT/i, text=/RESULTAT/i, text=/Parcelles/i');
                  if (await resultsCheck.count() > 0) {
                    stethoscopeClicked = true;
                    break;
                  }
                  
                  // If not, try clicking on map to see if tool is active
                  const mapContainer = page.locator('#esri\\.Map_0_container, .esriMapContainer').first();
                  if (await mapContainer.count() > 0) {
                    const mapBox = await mapContainer.boundingBox();
                    if (mapBox) {
                      await page.mouse.click(mapBox.x + mapBox.width / 2, mapBox.y + mapBox.height / 2);
                      await page.waitForTimeout(2000);
                      
                      // Check again for results
                      if (await resultsCheck.count() > 0) {
                        stethoscopeClicked = true;
                        break;
                      }
                    }
                  }
                }
              }
            } catch (e) {
              // Continue to next button
            }
          }
        } catch (e) {
          // Continue
        }
      }
      
      // Method 3: Try to find by SVG path or icon content (stethoscope usually has a specific icon)
      if (!stethoscopeClicked) {
        try {
          // Look for SVG elements that might represent a stethoscope
          const svgElements = page.locator('svg, [class*="icon"]');
          const svgCount = await svgElements.count();
          
          for (let i = 0; i < Math.min(svgCount, 20); i++) {
            try {
              const svg = svgElements.nth(i);
              const parent = svg.locator('..');
              
              if (await parent.isVisible()) {
                const parentClass = await parent.getAttribute('class').catch(() => '');
                if (parentClass.includes('Button') || parentClass.includes('button')) {
                  await parent.click({ timeout: 2000 });
                  await page.waitForTimeout(2000);
                  
                  // Check if stethoscope tool is now active
                  const mapClick = page.locator('#esri\\.Map_0_container, .esriMapContainer').first();
                  if (await mapClick.count() > 0) {
                    const mapBox = await mapClick.boundingBox();
                    if (mapBox) {
                      await page.mouse.click(mapBox.x + mapBox.width / 2, mapBox.y + mapBox.height / 2);
                      await page.waitForTimeout(3000);
                      
                      const resultsCheck = page.locator('text=/Parcelles/i, text=/RESULTAT/i');
                      if (await resultsCheck.count() > 0) {
                        stethoscopeClicked = true;
                        break;
                      }
                    }
                  }
                }
              }
            } catch (e) {
              // Continue
            }
          }
        } catch (e) {
          // Continue
        }
      }

      if (!stethoscopeClicked) {
        result.status = "ADDRESS_NOT_FOUND";
        result.errorMessage = "Stethoscope/identification tool not found. Please verify the page structure.";
        return result;
      }

      // Step 7: Click on the map to identify parcels (after stethoscope is activated)
      // The stethoscope tool should now be active, click on the map center
      const mapSelectors = [
        '#esri\\.Map_0_container',
        '.esriMapContainer',
        '[id*="map"]',
        '[class*="map"]',
        '.dijitContentPane:has([id*="map"])',
      ];

      let mapClicked = false;
      for (const selector of mapSelectors) {
        try {
          const mapContainer = page.locator(selector).first();
          if (await mapContainer.count() > 0) {
            const isVisible = await mapContainer.isVisible();
            if (isVisible) {
              const box = await mapContainer.boundingBox();
              if (box) {
                // Click center of map
                await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
                await page.waitForTimeout(3000);
                mapClicked = true;
                break;
              }
            }
          }
        } catch (e) {
          // Continue
        }
      }

      if (!mapClicked) {
        result.status = "ADDRESS_NOT_FOUND";
        result.errorMessage = "Could not click on map";
        return result;
      }

      // Step 8: Wait for identification results panel and find parcel link
      await page.waitForTimeout(3000);

      // Look for "RÉSULTAT DE L'IDENTIFICATION" panel
      // The results should appear in a panel, usually at the bottom or side
      const resultPanelSelectors = [
        'text=/RÉSULTAT DE L\'IDENTIFICATION/i',
        'text=/RESULTAT/i',
        '[id*="result"]',
        '[class*="result"]',
        '.dijitContentPane:has-text("Parcelles")',
      ];

      // Wait for results panel to appear
      let resultsPanelVisible = false;
      for (const selector of resultPanelSelectors) {
        try {
          const panel = page.locator(selector).first();
          if (await panel.count() > 0) {
            await panel.waitFor({ state: 'visible', timeout: 5000 });
            resultsPanelVisible = true;
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      if (!resultsPanelVisible) {
        await page.waitForTimeout(2000); // Wait a bit more
      }

      // Step 9: Find and click on parcel in the results table
      // Look for "Parcelles du cadastre" table in the identification results
      // The table should be in a panel titled "RÉSULTAT DE L'IDENTIFICATION"
      
      let parcelClicked = false;
      
      // First, try to find the table by looking for "Parcelles du cadastre" header
      const parcelTableHeader = page.locator('text=/Parcelles du cadastre/i, text=/Parcelles cadastrales/i').first();
      
      if (await parcelTableHeader.count() > 0) {
        // Find the table near this header
        const table = parcelTableHeader.locator('..').locator('table').first();
        
        if (await table.count() > 0) {
          // Get all rows in the table
          const rows = table.locator('tbody tr, tr');
          const rowCount = await rows.count();
          
          // Skip header row(s), start from row 1 or 2
          for (let r = 1; r < Math.min(rowCount, 5); r++) {
            try {
              const row = rows.nth(r);
              const rowText = await row.textContent();
              
              // Check if this is a data row (has CAPAKEY or similar parcel identifier)
              if (rowText && rowText.length > 10 && !rowText.includes("CAPAKEY")) {
                // Try clicking on the row
                const rowBox = await row.boundingBox();
                if (rowBox) {
                  // Click on the row
                  await page.mouse.click(rowBox.x + rowBox.width / 2, rowBox.y + rowBox.height / 2);
                  await page.waitForTimeout(3000);
                  
                  // Check if we navigated to a new page (parcel detail page)
                  const newUrl = page.url();
                  if (newUrl !== this.BASE_URL && newUrl.includes("parcelle")) {
                    parcelClicked = true;
                    break;
                  }
                  
                  // Alternative: Look for double-click or link in the row
                  const linkInRow = row.locator('a').first();
                  if (await linkInRow.count() > 0) {
                    await linkInRow.click();
                    await page.waitForTimeout(3000);
                    parcelClicked = true;
                    break;
                  }
                }
              }
            } catch (e) {
              // Continue to next row
            }
          }
        }
      }
      
      // Alternative method: Look for any table with parcel data
      if (!parcelClicked) {
        const allTables = page.locator('table');
        const tableCount = await allTables.count();
        
        for (let t = 0; t < tableCount; t++) {
          try {
            const table = allTables.nth(t);
            const tableText = await table.textContent();
            
            // Check if this table contains parcel information
            if (tableText && (tableText.includes("Section") || tableText.includes("Radical") || tableText.includes("CAPAKEY"))) {
              const rows = table.locator('tbody tr, tr');
              const rowCount = await rows.count();
              
              // Find first data row
              for (let r = 1; r < rowCount; r++) {
                const row = rows.nth(r);
                const rowText = await row.textContent();
                
                // Skip header rows
                if (rowText && !rowText.includes("CAPAKEY") && !rowText.includes("Section") && rowText.length > 20) {
                  // Try to click on the row
                  try {
                    await row.click({ timeout: 2000 });
                    await page.waitForTimeout(3000);
                    parcelClicked = true;
                    break;
                  } catch (e) {
                    // Try clicking on a cell
                    const cells = row.locator('td');
                    const cellCount = await cells.count();
                    if (cellCount > 0) {
                      await cells.first().click({ timeout: 2000 });
                      await page.waitForTimeout(3000);
                      parcelClicked = true;
                      break;
                    }
                  }
                  
                  if (parcelClicked) break;
                }
              }
              
              if (parcelClicked) break;
            }
          } catch (e) {
            // Continue to next table
          }
        }
      }

      // Alternative: Look for any link containing parcel information
      if (!parcelClicked) {
        const linkSelectors = [
          'a:has-text("parcelle")',
          'a[href*="parcelle"]',
          'a[href*="parcel"]',
        ];

        for (const selector of linkSelectors) {
          try {
            const links = page.locator(selector);
            const count = await links.count();
            
            if (count > 0) {
              for (let i = 0; i < count; i++) {
                const link = links.nth(i);
                if (await link.isVisible()) {
                  await link.click();
                  await page.waitForTimeout(3000);
                  parcelClicked = true;
                  break;
                }
              }
              if (parcelClicked) break;
            }
          } catch (e) {
            // Continue
          }
        }
      }

      if (!parcelClicked) {
        result.status = "ADDRESS_NOT_FOUND";
        result.errorMessage = "No parcels found in identification results or could not click on parcel";
        return result;
      }

      // Check if multiple parcels were found
      const parcelRows = await page.locator('table tr:has-text("Section"), table tr:has-text("Radical")').count();
      if (parcelRows > 2) {
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

