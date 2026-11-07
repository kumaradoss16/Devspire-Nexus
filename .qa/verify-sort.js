
const { chromium } = require("playwright-core");
const path = require("path");

const CHROME_PATH = process.env.LOCALAPPDATA + "\\ms-playwright\\chromium-1248\\chrome-win64\\chrome.exe";

async function verifySort() {
  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
  const viewports = [
    { width: 1440, height: 900, name: "desktop" },
    { width: 768, height: 1024, name: "tablet" },
    { width: 390, height: 844, name: "mobile" }
  ];
  
  const pages = ["ai-tools.html", "models.html", "developer-resources.html"];

  for (const pageName of pages) {
    for (const vp of viewports) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      const filePath = "file:///" + path.resolve(pageName).replace(/\\/g, "/");
      await page.goto(filePath, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(500);

      // Check toolbar & sort select existence and visibility
      const sortSelect = page.locator("#sort-select");
      const isVisible = await sortSelect.isVisible();
      if (!isVisible) throw new Error(pageName + " (" + vp.name + "): sort-select is not visible");

      // Verify computed z-index and bounding box
      const metrics = await page.evaluate(() => {
        const sel = document.getElementById("sort-select");
        const toolbar = sel.closest(".results-toolbar") || sel.closest("[class*='bg-surface-secondary']");
        const card = document.querySelector(".ui-card");
        const selRect = sel.getBoundingClientRect();
        const selZ = window.getComputedStyle(sel).zIndex;
        const toolZ = toolbar ? window.getComputedStyle(toolbar).zIndex : "none";
        const cardZ = card ? window.getComputedStyle(card).zIndex : "none";
        return {
          selZ, toolZ, cardZ,
          width: selRect.width,
          height: selRect.height,
          top: selRect.top,
          left: selRect.left
        };
      });

      // Test changing sort option
      const options = await sortSelect.locator("option").allTextContents();
      if (options.length < 2) throw new Error(pageName + ": insufficient sort options");
      
      await sortSelect.selectOption({ index: 1 });
      await page.waitForTimeout(300);

      console.log("PASS: " + pageName + " [" + vp.name + "] options=" + options.length + " selZ=" + metrics.selZ + " toolZ=" + metrics.toolZ + " cardZ=" + metrics.cardZ);
      await page.close();
    }
  }

  await browser.close();
  console.log("ALL SORT DROPDOWN CHECKS PASSED!");
}

verifySort().catch(err => {
  console.error("FAIL:", err);
  process.exit(1);
});
