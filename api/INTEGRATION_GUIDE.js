/**
 * INTEGRATION GUIDE - How to use transformSheetToTabs with existing index.html
 * 
 * Step 1: Include the transformation function in your HTML
 *   <script src="/api/transformSheetToTabs.js"></script>
 * 
 * Step 2: Update the sheet fetch & parse flow
 *   Replace or supplement the existing testSheetConnection() function
 */

// ============================================================================
// USAGE EXAMPLE - Add this to your index.html <script> section
// ============================================================================

async function loadTabsFromSheet() {
  try {
    // Fetch CSV from Google Sheets
    const response = await fetch(
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vROmN0beh5YCCEEywnT0x469m9IIdemfJumu2QSuFmyehA6fF0_B7PBd01Tj0dIxO1crNKwrWY7BHqS/pub?output=csv"
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch sheet: ${response.status}`);
    }

    const csv = await response.text();

    // Parse CSV with PapaParse (already included in your HTML)
    const parsed = Papa.parse(csv, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true,
    });

    console.log('Parsed CSV rows:', parsed.data);

    // Transform to CONFIG.tabs structure
    const newTabs = transformSheetToTabs(parsed.data);

    // Validate structure
    if (!validateTabs(newTabs)) {
      console.error('Validation failed: transformed tabs structure is invalid');
      return null;
    }

    console.log('Transformed tabs:', newTabs);
    return newTabs;

  } catch (error) {
    console.error('loadTabsFromSheet error:', error);
    return null;
  }
}

// ============================================================================
// OPTION A: Replace CONFIG.tabs with sheet data (fully dynamic)
// ============================================================================

async function initializeFromSheet() {
  const sheetTabs = await loadTabsFromSheet();
  if (sheetTabs && sheetTabs.length > 0) {
    CONFIG.tabs = sheetTabs;
    console.log('✓ CONFIG.tabs replaced with sheet data');
    // Re-render UI if needed
    location.reload(); // or call your render function
  } else {
    console.warn('Failed to load tabs from sheet, using default CONFIG');
  }
}

// ============================================================================
// OPTION B: Merge sheet data with CONFIG.tabs (hybrid approach)
// ============================================================================

async function mergeSheetTabs() {
  const sheetTabs = await loadTabsFromSheet();
  if (sheetTabs && sheetTabs.length > 0) {
    // Replace matching tabs by id, keep others
    const sheetTabIds = new Set(sheetTabs.map(t => t.id));
    CONFIG.tabs = [
      ...sheetTabs,
      ...CONFIG.tabs.filter(t => !sheetTabIds.has(t.id))
    ];
    console.log('✓ CONFIG.tabs merged with sheet data');
  }
}

// ============================================================================
// CSV STRUCTURE - Expected format in Google Sheet
// ============================================================================
/*

Tab              | content_type | title              | subtitle                          | description                                                | action_type | resources
-----------------|--------------|--------------------|------------------------------------|-------------------------------------------------------------|--------------|----------
Discover         | live         | Career Coach       | I'm not sure what career is right | An AI career coach that helps... | external    | {"icon":"🧭","iconBg":"linear-gradient(135deg,#F093FB,#F5576C)","chips":["💼 All levels","🤖 AI Chat","⚡ 5 min"],"category":"Career","link":"https://..."}
Discover         | live         | Stream Finder      | I want to choose the right stream  | Helps Class 10 students choose... | embed       | {"icon":"🎓","iconBg":"linear-gradient(135deg,#667EEA,#764BA2)","chips":["🎯 For students"],"category":"Education","link":"https://..."}
Prepare          | live         | Resume Builder     | I need a professional resume      | Answer simple questions and get... | external    | {"icon":"📄","iconBg":"linear-gradient(135deg,#4FACFE,#00F2FE)","chips":["📄 ATS-friendly"],"category":"Resume","link":"https://...","modules":[{"name":"Module 1","link":"#"}]}
Prepare          | soon         | PM Roadmap         | null                               | A personalised roadmap to break...| external    | {"icon":"🗺️","iconBg":"linear-gradient(135deg,#F093FB,#667EEA)","category":"Product"}
Grow             | beta         | Analytics Coach    | null                               | Learn data analytics through...   | external    | {"icon":"📊","iconBg":"linear-gradient(135deg,#667EEA,#43E97B)","chips":["📊 Data Skills"],"category":"Skills","modules":[{"name":"Excel","link":"#"},{"name":"SQL","link":"#"}]}

*/

// ============================================================================
// SAFE RESOURCES JSON EXAMPLE (what to store in the sheet)
// ============================================================================

const exampleResource = {
  // Required by renderer
  icon: "🧭",
  iconBg: "linear-gradient(135deg,#F093FB,#F5576C)",
  category: "Career",
  link: "https://chatgpt.com/g/g-123456",
  
  // Optional enhancements
  chips: ["💼 All levels", "🤖 AI Chat", "⚡ 5 min"],
  modules: [
    { name: "Module 1", link: "https://..." },
    { name: "Module 2", link: "https://..." }
  ]
};

// Serialize to CSV as JSON string:
const resourcesJson = JSON.stringify(exampleResource).replace(/"/g, '""');
// Then wrap in quotes: "{\"icon\":\"...\"}"
