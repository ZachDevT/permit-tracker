const { chromium } = require('playwright');

async function testScraper() {
  const browser = await chromium.launch({
    headless: false, // Show browser for debugging
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  });

  const page = await context.newPage();

  try {
    console.log('📍 Step 1: Navigating to BDES...');
    await page.goto('https://bdes.spw.wallonie.be/portal/web/guest/app/-/consultation/carte', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    await page.waitForTimeout(3000);
    console.log('✅ Page loaded');

    // Step 1: Handle conditions acceptance
    console.log('📍 Step 2: Checking for conditions modal...');
    try {
      const checkbox = page.locator('input[type="checkbox"]:near(:text("J\'ai lu"))').first();
      if (await checkbox.count() > 0 && await checkbox.isVisible()) {
        await checkbox.check();
        await page.waitForTimeout(500);
        console.log('✅ Checkbox checked');
      }

      const acceptButton = page.locator('button:has-text("Accepter"), span:has-text("Accepter"):visible').first();
      if (await acceptButton.count() > 0 && await acceptButton.isVisible()) {
        await acceptButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ Conditions accepted');
      }
    } catch (e) {
      console.log('ℹ️  Conditions modal not found or already accepted');
    }

    // Step 2: Close help dialog
    console.log('📍 Step 3: Closing help dialog...');
    try {
      const closeButton = page.locator('.dijitDialogCloseIcon, button[title*="Fermer"]').first();
      if (await closeButton.count() > 0 && await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(1500);
        console.log('✅ Help dialog closed');
      }
    } catch (e) {
      console.log('ℹ️  Help dialog not found or already closed');
    }

    // Step 3: Find search input
    console.log('📍 Step 4: Finding search input...');
    await page.waitForSelector('input[type="text"], input[placeholder*="Adresse"]', {
      timeout: 15000,
    });
    await page.waitForTimeout(1000);

    const searchInput = page.locator('input[placeholder*="Adresse"], input[type="text"]:visible').first();
    console.log('✅ Search input found');

    // Step 4: Fill address
    console.log('📍 Step 5: Filling address "herve"...');
    await searchInput.fill('herve');
    await page.waitForTimeout(2000);
    console.log('✅ Address filled');

    // Step 5: Click search icon
    console.log('📍 Step 6: Clicking search icon...');
    
    // First, let's see what's around the input
    const inputParent = searchInput.locator('..');
    const buttonsNearInput = inputParent.locator('button, [role="button"], div[class*="Button"]');
    const buttonCount = await buttonsNearInput.count();
    console.log(`Found ${buttonCount} clickable elements near input`);
    
    for (let i = 0; i < buttonCount; i++) {
      try {
        const btn = buttonsNearInput.nth(i);
        const btnClass = await btn.getAttribute('class').catch(() => '') || '';
        const btnTag = await btn.evaluate(el => el.tagName).catch(() => '') || '';
        console.log(`  Element ${i} (${btnTag}): class="${btnClass}"`);
      } catch (e) {}
    }
    
    // Look for the search button div (SpwGeolocalisationSearchInputButton)
    const searchButtonSelectors = [
      'div.SpwGeolocalisationSearchInputButton',
      '.SpwGeolocalisationSearchInputButton',
      '[class*="SpwGeolocalisationSearchInputButton"]',
      'button:has([class*="search"])',
      '[class*="SpwGeolocalisationSearchInput"] button',
      'input[placeholder*="Adresse"] + div',
      'input[placeholder*="Adresse"] ~ div',
    ];

    let searchIconClicked = false;
    for (const selector of searchButtonSelectors) {
      try {
        const searchButton = page.locator(selector).first();
        if (await searchButton.count() > 0) {
          const isVisible = await searchButton.isVisible().catch(() => false);
          if (isVisible) {
            await searchButton.click({ timeout: 2000 });
            await page.waitForTimeout(2000);
            searchIconClicked = true;
            console.log(`✅ Search icon clicked (selector: ${selector})`);
            break;
          }
        }
      } catch (e) {
        // Continue
      }
    }

    if (!searchIconClicked) {
      console.log('⚠️  Search icon not found, trying Enter...');
      await searchInput.press('Enter');
      await page.waitForTimeout(3000);
    }

    // Step 6: Wait for suggestions and click first one
    console.log('📍 Step 7: Waiting for suggestions...');
    await page.waitForTimeout(2000);

    const suggestionSelectors = [
      '.dijitComboBoxMenu',
      '.dijitComboBoxMenuPopup',
      '.dijitMenuItem',
      '[role="option"]',
    ];

    let suggestionClicked = false;
    for (const selector of suggestionSelectors) {
      try {
        const suggestions = page.locator(selector);
        const count = await suggestions.count();
        if (count > 0) {
          await page.waitForTimeout(1000);
          const firstSuggestion = suggestions.first();
          if (await firstSuggestion.isVisible()) {
            await firstSuggestion.click({ timeout: 2000 });
            await page.waitForTimeout(3000);
            suggestionClicked = true;
            console.log(`✅ Suggestion clicked (selector: ${selector})`);
            break;
          }
        }
      } catch (e) {
        // Continue
      }
    }

    if (!suggestionClicked) {
      console.log('⚠️  No suggestions found');
    }

    // Step 7: Wait for map
    console.log('📍 Step 8: Waiting for map to load...');
    await page.waitForTimeout(3000);
    console.log('✅ Map should be loaded');

    // Step 8: Click stethoscope
    console.log('📍 Step 9: Looking for stethoscope icon...');
    await page.waitForTimeout(2000);

    const stethoscopeSelectors = [
      '.myCustomAdvancedIdentifyButton',
      '[class*="stethoscope"]',
      '[class*="identify"]',
      'button[title*="identification"]',
      '.dijitToolbar button:nth-child(6)',
      '.dijitToolbar button:nth-child(7)',
    ];

    let stethoscopeClicked = false;
    for (const selector of stethoscopeSelectors) {
      try {
        const stethoscope = page.locator(selector).first();
        if (await stethoscope.count() > 0 && await stethoscope.isVisible()) {
          await stethoscope.click({ timeout: 2000 });
          await page.waitForTimeout(2000);
          stethoscopeClicked = true;
          console.log(`✅ Stethoscope clicked (selector: ${selector})`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }

    if (!stethoscopeClicked) {
      console.log('⚠️  Stethoscope not found, trying all toolbar buttons...');
      
      // Try different toolbar selectors
      const toolbarSelectors = [
        '.dijitToolbar',
        '[class*="toolbar"]',
        '[class*="Toolbar"]',
      ];
      
      for (const toolbarSelector of toolbarSelectors) {
        const toolbar = page.locator(toolbarSelector).first();
        if (await toolbar.count() > 0) {
          console.log(`Found toolbar with selector: ${toolbarSelector}`);
          const toolbarButtons = toolbar.locator('button, .dijitButton, [role="button"]');
          const buttonCount = await toolbarButtons.count();
          console.log(`Found ${buttonCount} buttons in toolbar`);

          for (let i = 0; i < Math.min(buttonCount, 15); i++) {
            try {
              const button = toolbarButtons.nth(i);
              if (await button.isVisible()) {
                const buttonClass = await button.getAttribute('class').catch(() => '') || '';
                const buttonTitle = await button.getAttribute('title').catch(() => '') || '';
                const buttonAriaLabel = await button.getAttribute('aria-label').catch(() => '') || '';
                console.log(`  Button ${i}: class="${buttonClass}", title="${buttonTitle}", aria-label="${buttonAriaLabel}"`);
                
                // Check if this might be the stethoscope
                const combined = (buttonClass + ' ' + buttonTitle + ' ' + buttonAriaLabel).toLowerCase();
                if (combined.includes('identify') || combined.includes('stethoscope') || combined.includes('mycustom')) {
                  console.log(`  ⭐ This might be the stethoscope! Trying to click...`);
                  await button.click({ timeout: 2000 });
                  await page.waitForTimeout(2000);
                  stethoscopeClicked = true;
                  break;
                }
              }
            } catch (e) {
              // Continue
            }
          }
          
          if (stethoscopeClicked) break;
        }
      }
      
      // Also try finding by the specific class from the image
      // The class is on a span, but we need to click the parent button
      const advancedIdentifySpan = page.locator('.myCustomAdvancedIdentifyButton, [class*="myCustomAdvancedIdentify"]').first();
      if (await advancedIdentifySpan.count() > 0) {
        console.log('✅ Found stethoscope span with myCustomAdvancedIdentifyButton class');
        
        // Check for overlay modal that might be blocking
        const overlay = page.locator('.ui-widget-overlay, [class*="overlay"]').first();
        if (await overlay.count() > 0 && await overlay.isVisible()) {
          console.log('⚠️  Overlay modal detected, trying to close it...');
          // Try to find close button or click outside
          const closeButtons = page.locator('button:has-text("Fermer"), .ui-dialog-titlebar-close, [class*="close"]');
          const closeCount = await closeButtons.count();
          if (closeCount > 0) {
            await closeButtons.first().click({ timeout: 2000 });
            await page.waitForTimeout(1000);
            console.log('✅ Closed overlay modal');
          } else {
            // Click outside the modal
            await page.mouse.click(10, 10);
            await page.waitForTimeout(1000);
            console.log('✅ Clicked outside modal');
          }
        }
        
        // Click the parent button instead of the span
        const parentButton = advancedIdentifySpan.locator('..').locator('button, [role="button"]').first();
        if (await parentButton.count() > 0) {
          await parentButton.click({ timeout: 3000, force: true });
          await page.waitForTimeout(2000);
          stethoscopeClicked = true;
          console.log('✅ Clicked stethoscope button (parent of span)');
        } else {
          // Try clicking the span with force
          await advancedIdentifySpan.click({ timeout: 3000, force: true });
          await page.waitForTimeout(2000);
          stethoscopeClicked = true;
          console.log('✅ Clicked stethoscope span (forced)');
        }
      }
      
      // Alternative: Click button 5 which has title "Informations sur l'état des sols"
      if (!stethoscopeClicked) {
        const infoButton = page.locator('button[title="Informations sur l\'état des sols"]').first();
        if (await infoButton.count() > 0 && await infoButton.isVisible()) {
          await infoButton.click({ timeout: 3000, force: true });
          await page.waitForTimeout(2000);
          stethoscopeClicked = true;
          console.log('✅ Clicked button with title "Informations sur l\'état des sols"');
        }
      }
    }

    // Step 9: Click on map
    console.log('📍 Step 10: Clicking on map...');
    const mapSelectors = [
      '#esri\\.Map_0_container',
      '.esriMapContainer',
      '[id*="map"]',
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
              await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
              await page.waitForTimeout(3000);
              mapClicked = true;
              console.log('✅ Map clicked');
              break;
            }
          }
        }
      } catch (e) {
        // Continue
      }
    }

    // Step 10: Look for results
    console.log('📍 Step 11: Looking for identification results...');
    await page.waitForTimeout(3000);

    // Check for results panel
    const resultsText = page.locator('text=/RÉSULTAT/i').first();
    const resultsTextCount = await resultsText.count();
    
    const parcelText = page.locator('text=/Parcelles/i').first();
    const parcelTextCount = await parcelText.count();
    
    const parcelTable = page.locator('table:has-text("Parcelles")').first();
    const parcelTableCount = await parcelTable.count();
    
    console.log(`Results text found: ${resultsTextCount}`);
    console.log(`Parcels text found: ${parcelTextCount}`);
    console.log(`Parcel table found: ${parcelTableCount}`);

    if (resultsTextCount > 0 || parcelTextCount > 0 || parcelTableCount > 0) {
      console.log('✅ Results panel found!');
      
      if (parcelTableCount > 0) {
        console.log('✅ Parcel table found');
        const tableText = await parcelTable.textContent();
        console.log('Table content preview:', tableText?.substring(0, 300));
      }
    } else {
      console.log('⚠️  No results found');
      console.log('Taking screenshot for debugging...');
      await page.screenshot({ path: 'debug-no-results.png', fullPage: true });
      console.log('Screenshot saved as debug-no-results.png');
    }

    console.log('\n✅ Test completed! Browser will stay open for 30 seconds...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

testScraper().catch(console.error);

