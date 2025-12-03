import { chromium, Browser, Page } from "playwright";
import { ScrapingStep, PermitResult } from "@/lib/types/scraping";

export type { ScrapingStep, PermitResult };

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

  async scrapePermit(company: string, address: string, onStepUpdate?: (step: ScrapingStep) => void): Promise<PermitResult> {
    const result: PermitResult = {
      company,
      address,
      latestPermitDate: null,
      permitPageLink: null,
      status: "ERROR",
      steps: [],
    };

    const addStep = (step: string, status: "success" | "error" | "pending", message?: string) => {
      const stepObj: ScrapingStep = {
        step,
        status,
        message: message || "", // Ensure message is never undefined
        timestamp: new Date(),
      };
      result.steps?.push(stepObj);
      if (onStepUpdate) {
        onStepUpdate(stepObj);
      }
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
      // Step 0: Navigate to the BDES map
      addStep("Navigation vers BDES", "pending");
      await page.goto(this.BASE_URL, { waitUntil: "networkidle", timeout: this.TIMEOUT });
      await page.waitForTimeout(2000);
      addStep("Navigation vers BDES", "success", "Page chargée");

      // Step 1: Handle "Informations et conditions d'utilisation" modal
      addStep("Gestion des conditions d'utilisation", "pending");
      await page.waitForTimeout(3000);

      // Look for the terms and conditions acceptance modal
      let conditionsAccepted = false;
      
      try {
        // Method 1: Look for checkbox with "J'ai lu et j'accepte" - try multiple approaches
        const checkboxSelectors = [
          'input[type="checkbox"]:near(:text("J\'ai lu"))',
          'input[type="checkbox"]:near(:text("accepte"))',
          'input[type="checkbox"]:near(:text("J\'accepte"))',
          'label:has-text("J\'ai lu") input[type="checkbox"]',
          'label:has-text("J\'accepte") input[type="checkbox"]',
          'label:has-text("accepte") input[type="checkbox"]',
          '.dijitCheckBox input[type="checkbox"]',
          'input[type="checkbox"]',
        ];

        for (const selector of checkboxSelectors) {
          try {
            const checkboxes = page.locator(selector);
            const count = await checkboxes.count();
            
            for (let i = 0; i < count; i++) {
              const checkbox = checkboxes.nth(i);
              if (await checkbox.isVisible()) {
                // Check if this checkbox is in a modal/dialog about conditions
                const parent = checkbox.locator('..').locator('..');
                const parentText = await parent.textContent().catch(() => '') || '';
                
                if (parentText.includes('conditions') || parentText.includes('utilisation') || parentText.includes('accepte')) {
                  await checkbox.check({ timeout: 2000 });
                  await page.waitForTimeout(1000);
                  conditionsAccepted = true;
                  addStep("Gestion des conditions d'utilisation", "success", "Checkbox cochée");
                  break;
                }
              }
            }
            
            if (conditionsAccepted) break;
          } catch (e) {
            // Try next selector
          }
        }
        
        // If no specific checkbox found, try checking any visible checkbox in a modal
        if (!conditionsAccepted) {
          const allCheckboxes = page.locator('input[type="checkbox"]');
          const checkboxCount = await allCheckboxes.count();
          
          for (let i = 0; i < checkboxCount; i++) {
            try {
              const checkbox = allCheckboxes.nth(i);
              if (await checkbox.isVisible()) {
                // Check if it's in a dialog/modal
                const dialog = checkbox.locator('..').locator('..').locator('..').locator('[class*="dialog"], [class*="Dialog"], [class*="modal"]');
                if (await dialog.count() > 0) {
                  await checkbox.check({ timeout: 2000 });
                  await page.waitForTimeout(1000);
                  conditionsAccepted = true;
                  addStep("Gestion des conditions d'utilisation", "success", "Checkbox dans modal cochée");
                  break;
                }
              }
            } catch (e) {
              // Continue
            }
          }
        }

        // Method 2: Look for Accept button - try multiple approaches
        const acceptButtonSelectors = [
          'button:has-text("Accepter")',
          'button:has-text("Accept")',
          'span:has-text("Accepter"):visible',
          '[role="button"]:has-text("Accepter")',
          '.dijitButton:has-text("Accepter")',
          '.dijitButton span:has-text("Accepter")',
          'button span:has-text("Accepter")',
        ];

        for (const selector of acceptButtonSelectors) {
          try {
            const acceptButtons = page.locator(selector);
            const count = await acceptButtons.count();
            
            for (let i = 0; i < count; i++) {
              const acceptButton = acceptButtons.nth(i);
              if (await acceptButton.isVisible()) {
                await acceptButton.click({ timeout: 2000 });
                await page.waitForTimeout(2000);
                conditionsAccepted = true;
                addStep("Gestion des conditions d'utilisation", "success", "Bouton Accepter cliqué");
                break;
              }
            }
            
            if (conditionsAccepted) break;
          } catch (e) {
            // Try next selector
          }
        }
      } catch (e) {
        console.log("Error handling conditions modal:", e);
      }
      
      // Verify if conditions were accepted
      if (!conditionsAccepted) {
        // Check if modal is still visible - use separate selectors
        const conditionsText = page.locator('text=/conditions/i').first();
        const utilisationText = page.locator('text=/utilisation/i').first();
        const conditionsDialog = page.locator('[class*="dialog"]:has-text("conditions")').first();
        
        const conditionsCount = await conditionsText.count();
        const utilisationCount = await utilisationText.count();
        const dialogCount = await conditionsDialog.count();
        
        const modalCount = conditionsCount + utilisationCount + dialogCount;
        
        if (modalCount > 0) {
          addStep("Gestion des conditions d'utilisation", "error", "Modal toujours visible");
        } else {
          addStep("Gestion des conditions d'utilisation", "success", "Modal non présente ou déjà acceptée");
        }
      }

      // Step 2: Handle "Mode d'emploi et conseils d'utilisation" dialog
      addStep("Fermeture du dialog d'aide", "pending");
      await page.waitForTimeout(2000);

      let helpDialogClosed = false;
      
      try {
        // Method 1: Look for close button (X) in dialog title bar
        const closeButtonSelectors = [
          '.dijitDialogCloseIcon',
          '[class*="dijitDialogClose"]',
          '[class*="DialogClose"]',
          '.dijitTitleBar .dijitDialogCloseIcon',
          '.dijitTitleBar [class*="close"]',
          'button[title*="Fermer"]',
          'button[aria-label*="Fermer"]',
          'button[aria-label*="Close"]',
          'span[class*="close"]:visible',
          '[class*="closeIcon"]',
        ];

        for (const selector of closeButtonSelectors) {
          try {
            const closeButtons = page.locator(selector);
            const count = await closeButtons.count();
            
            for (let i = 0; i < count; i++) {
              const closeButton = closeButtons.nth(i);
              if (await closeButton.isVisible()) {
                // Check if it's in a dialog
                const dialog = closeButton.locator('..').locator('..').locator('[class*="dialog"], [class*="Dialog"]');
                if (await dialog.count() > 0 || await closeButton.locator('..').locator('[class*="dialog"]').count() > 0) {
                  await closeButton.click({ timeout: 2000 });
                  await page.waitForTimeout(1500);
                  helpDialogClosed = true;
                  addStep("Fermeture du dialog d'aide", "success", "Bouton X cliqué");
                  break;
                }
              }
            }
            
            if (helpDialogClosed) break;
          } catch (e) {
            // Try next selector
          }
        }

        // Method 2: Look for "Fermer" button in dialog
        if (!helpDialogClosed) {
          const fermerButtons = page.locator('button:has-text("Fermer"), span:has-text("Fermer"):visible, [role="button"]:has-text("Fermer")');
          const fermerCount = await fermerButtons.count();
          
          for (let i = 0; i < fermerCount; i++) {
            try {
              const fermerButton = fermerButtons.nth(i);
              if (await fermerButton.isVisible()) {
                // Check if it's in a dialog about help/mode d'emploi
                const parent = fermerButton.locator('..').locator('..').locator('..');
                const parentText = await parent.textContent().catch(() => '') || '';
                
                if (parentText.includes('Mode d\'emploi') || parentText.includes('conseil') || parentText.includes('aide')) {
                  await fermerButton.click({ timeout: 2000 });
                  await page.waitForTimeout(1500);
                  helpDialogClosed = true;
                  addStep("Fermeture du dialog d'aide", "success", "Bouton Fermer cliqué");
                  break;
                }
              }
            } catch (e) {
              // Continue
            }
          }
        }
        
        // Method 3: Look for any dialog and try to close it
        if (!helpDialogClosed) {
          const dialogs = page.locator('[class*="dialog"], [class*="Dialog"], [class*="modal"]:visible');
          const dialogCount = await dialogs.count();
          
          for (let i = 0; i < dialogCount; i++) {
            try {
              const dialog = dialogs.nth(i);
              if (await dialog.isVisible()) {
                const dialogText = await dialog.textContent().catch(() => '') || '';
                
                // Check if it's a help/instructions dialog
                if (dialogText.includes('Mode d\'emploi') || dialogText.includes('conseil') || dialogText.includes('aide')) {
                  // Try to find close button in this dialog
                  const closeInDialog = dialog.locator('.dijitDialogCloseIcon, [class*="close"], button:has-text("Fermer")').first();
                  if (await closeInDialog.count() > 0 && await closeInDialog.isVisible()) {
                    await closeInDialog.click({ timeout: 2000 });
                    await page.waitForTimeout(1500);
                    helpDialogClosed = true;
                    addStep("Fermeture du dialog d'aide", "success", "Dialog d'aide fermé");
                    break;
                  }
                }
              }
            } catch (e) {
              // Continue
            }
          }
        }
      } catch (e) {
        console.log("Error handling help dialog:", e);
      }
      
      // Verify if dialog was closed
      if (!helpDialogClosed) {
        const helpStillVisible = page.locator('text=/Mode d\'emploi/i, text=/conseil/i');
        const helpCount = await helpStillVisible.count();
        
        if (helpCount > 0) {
          addStep("Fermeture du dialog d'aide", "error", "Dialog toujours visible");
        } else {
          addStep("Fermeture du dialog d'aide", "success", "Dialog non présent ou déjà fermé");
        }
      }

      // Step 3: Wait for the search field to be available
      addStep("Recherche du champ d'adresse", "pending");
      await page.waitForSelector('input[type="text"], input[placeholder*="Adresse"], input[placeholder*="adresse"], input[placeholder*="rue"]', {
        timeout: 15000,
      });
      await page.waitForTimeout(1000);
      addStep("Recherche du champ d'adresse", "success", "Champ trouvé");

      // Step 4: Find and fill the search input (address bar)
      addStep("Saisie de l'adresse", "pending");
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
      addStep("Saisie de l'adresse", "success", `Adresse "${address}" saisie`);

      // Step 5: Click on the search icon (magnifying glass) - IMPORTANT: Click icon, not Enter
      addStep("Clic sur l'icône de recherche", "pending");
      
      // Find the search button/icon next to the input
      // Based on images: it's a button with class like SpwGeolocalisationSearchInputButton
      const searchButtonSelectors = [
        '.SpwGeolocalisationSearchInputButton',
        'button:has([class*="search"])',
        'button:has([class*="Search"])',
        '[class*="SpwGeolocalisationSearchInput"] button',
        'input[placeholder*="Adresse"] + button',
        'input[placeholder*="Adresse"] ~ button',
        '.dijitButton:has([class*="search"])',
        // Look for magnifying glass icon
        'button:has(svg)',
        '[class*="searchButton"]',
      ];

      let searchIconClicked = false;
      for (const selector of searchButtonSelectors) {
        try {
          const searchButton = page.locator(selector).first();
          if (await searchButton.count() > 0 && await searchButton.isVisible()) {
            await searchButton.click({ timeout: 2000 });
            await page.waitForTimeout(2000);
            searchIconClicked = true;
            addStep("Clic sur l'icône de recherche", "success", "Icône de recherche cliquée");
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      // Fallback: Look for the search button near the input field
      if (!searchIconClicked) {
        try {
          // Get the input's parent and look for button inside
          const inputParent = searchInput.locator('..');
          const buttonInParent = inputParent.locator('button').first();
          if (await buttonInParent.count() > 0) {
            await buttonInParent.click({ timeout: 2000 });
            await page.waitForTimeout(2000);
            searchIconClicked = true;
            addStep("Clic sur l'icône de recherche", "success", "Bouton de recherche trouvé et cliqué");
          }
        } catch (e) {
          // Continue
        }
      }

      // If still not clicked, try pressing Enter as last resort
      if (!searchIconClicked) {
        await searchInput.press("Enter");
        await page.waitForTimeout(3000);
        addStep("Clic sur l'icône de recherche", "success", "Utilisation de Enter (fallback)");
      }

      // Step 6: Wait for search results and click on the first suggestion
      addStep("Sélection d'un résultat de recherche", "pending");
      await page.waitForTimeout(2000);

      // Wait for suggestions/dropdown to appear
      const suggestionSelectors = [
        '.dijitComboBoxMenu',
        '.dijitComboBoxMenuPopup',
        '.dijitMenuItem',
        '[role="option"]',
        '.dijitPopup:has(.dijitMenuItem)',
        '[class*="suggestion"]',
        '[class*="Suggestion"]',
        'li:has-text("' + address.split(',')[0] + '")',
      ];

      let suggestionClicked = false;
      for (const selector of suggestionSelectors) {
        try {
          const suggestions = page.locator(selector);
          const count = await suggestions.count();
          if (count > 0) {
            // Wait for suggestions to be visible
            await page.waitForTimeout(1000);
            const firstSuggestion = suggestions.first();
            if (await firstSuggestion.isVisible()) {
              await firstSuggestion.click({ timeout: 2000 });
              await page.waitForTimeout(3000);
              suggestionClicked = true;
              addStep("Sélection d'un résultat de recherche", "success", "Première suggestion cliquée");
              break;
            }
          }
        } catch (e) {
          // Continue
        }
      }

      if (!suggestionClicked) {
        addStep("Sélection d'un résultat de recherche", "error", "Aucune suggestion trouvée");
        result.status = "ADDRESS_NOT_FOUND";
        result.errorMessage = "No search suggestions found";
        return result;
      }

      // Step 7: Wait for map to load after search
      addStep("Chargement de la carte", "pending");
      await page.waitForTimeout(3000);
      addStep("Chargement de la carte", "success", "Carte chargée");

      // Step 8: Click the stethoscope icon (medical tool icon) - identification tool
      addStep("Activation de l'outil stethoscope", "pending");
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
      
      // Method 3: Find by the specific class from the image (myCustomAdvancedIdentifyButton)
      // The class is on a span, but we need to click the parent button
      if (!stethoscopeClicked) {
        try {
          const advancedIdentifySpan = page.locator('.myCustomAdvancedIdentifyButton, [class*="myCustomAdvancedIdentify"]').first();
          if (await advancedIdentifySpan.count() > 0) {
            // Click the parent button instead of the span
            const parentButton = advancedIdentifySpan.locator('..').locator('button, [role="button"]').first();
            if (await parentButton.count() > 0) {
              await parentButton.click({ timeout: 3000, force: true });
              await page.waitForTimeout(2000);
              stethoscopeClicked = true;
            } else {
              // Try clicking the span with force
              await advancedIdentifySpan.click({ timeout: 3000, force: true });
              await page.waitForTimeout(2000);
              stethoscopeClicked = true;
            }
          }
        } catch (e) {
          // Continue
        }
      }
      
      // Method 4: Click button with title "Informations sur l'état des sols"
      if (!stethoscopeClicked) {
        try {
          const infoButton = page.locator('button[title="Informations sur l\'état des sols"]').first();
          if (await infoButton.count() > 0 && await infoButton.isVisible()) {
            await infoButton.click({ timeout: 3000, force: true });
            await page.waitForTimeout(2000);
            stethoscopeClicked = true;
          }
        } catch (e) {
          // Continue
        }
      }

      if (!stethoscopeClicked) {
        addStep("Activation de l'outil stethoscope", "error", "Icône stethoscope non trouvée");
        result.status = "ADDRESS_NOT_FOUND";
        result.errorMessage = "Stethoscope/identification tool not found. Please verify the page structure.";
        return result;
      }
      
      addStep("Activation de l'outil stethoscope", "success", "Outil d'identification activé");

      // Step 9: Click on the map to identify parcels (after stethoscope is activated)
      addStep("Clic sur la carte pour identifier les parcelles", "pending");
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
        addStep("Clic sur la carte pour identifier les parcelles", "error", "Impossible de cliquer sur la carte");
        result.status = "ADDRESS_NOT_FOUND";
        result.errorMessage = "Could not click on map";
        return result;
      }
      
      addStep("Clic sur la carte pour identifier les parcelles", "success", "Clic sur la carte effectué");

      // Step 10: Wait for identification results panel and find parcel link
      addStep("Attente des résultats d'identification", "pending");
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
        addStep("Sélection de la parcelle", "error", "Aucune parcelle trouvée ou impossible de cliquer");
        result.status = "ADDRESS_NOT_FOUND";
        result.errorMessage = "No parcels found in identification results or could not click on parcel";
        return result;
      }
      
      addStep("Sélection de la parcelle", "success", "Parcelle sélectionnée");

      // Check if multiple parcels were found
      const parcelRows = await page.locator('table tr:has-text("Section"), table tr:has-text("Radical")').count();
      if (parcelRows > 2) {
        result.status = "MULTIPLE_PARCELS";
        addStep("Sélection de la parcelle", "success", `Plusieurs parcelles trouvées (${parcelRows})`);
      }

      // Step 11: Get the current URL (parcel information page)
      addStep("Navigation vers la page de la parcelle", "pending");
      await page.waitForTimeout(2000);
      
      // Wait for navigation to parcel detail page
      await page.waitForLoadState("networkidle", { timeout: 10000 });
      const currentUrl = page.url();
      result.permitPageLink = currentUrl;
      addStep("Navigation vers la page de la parcelle", "success", `URL: ${currentUrl}`);

      // Step 12: Look for "Procédures" tab
      addStep("Ouverture de l'onglet Procédures", "pending");
      const proceduresTabSelector = 'button:has-text("Procédures"), a:has-text("Procédures"), [role="tab"]:has-text("Procédures"), [class*="tab"]:has-text("Procédures")';
      const proceduresTab = page.locator(proceduresTabSelector).first();

      if (await proceduresTab.count() === 0) {
        addStep("Ouverture de l'onglet Procédures", "error", "Onglet Procédures non trouvé");
        result.status = "NO_PERMIT_DATA";
        result.errorMessage = "Procédures tab not found";
        return result;
      }

      await proceduresTab.click();
      await page.waitForTimeout(2000);
      addStep("Ouverture de l'onglet Procédures", "success", "Onglet Procédures ouvert");

      // Step 13: Wait for the procedures table to load
      addStep("Chargement du tableau des procédures", "pending");
      await page.waitForSelector('table, [class*="table"], [role="table"]', { timeout: 10000 });
      addStep("Chargement du tableau des procédures", "success", "Tableau chargé");

      // Step 14: Extract permit data from the table
      addStep("Extraction des données de permis", "pending");
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
        addStep("Extraction des données de permis", "success", `Date trouvée: ${latestDate}`);
      } else {
        result.status = "NO_PERMIT_DATA";
        result.errorMessage = "No 'Permis délivré' entries found";
        addStep("Extraction des données de permis", "error", "Aucun 'Permis délivré' trouvé");
      }
    } catch (error: any) {
      console.error(`Error scraping permit for ${company}:`, error);
      addStep("Erreur générale", "error", error.message || "Unknown error occurred");
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

