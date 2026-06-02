function safeParseResources(resources) {

  try {
    return JSON.parse(resources);
  } catch (e) {
    console.error("Invalid resources JSON", e);
    return [];
  }

}
/**
 * Transforms CSV rows from Google Sheet into CONFIG.tabs structure
 * @param {Array} rows - Parsed CSV rows from PapaParse with headers
 * @returns {Array} Transformed tabs array compatible with existing CONFIG.tabs
 */
function transformSheetToTabs(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    console.warn('transformSheetToTabs: Empty or invalid rows input');
    return [];
  }

  // Group rows by Tab
  const tabsMap = new Map();

  rows.forEach((row) => {
    if (!row.Tab || !row.title) {
      console.warn('transformSheetToTabs: Skipping row with missing Tab or title', row);
      return;
    }

    const tabId = row.Tab.toLowerCase().replace(/\s+/g, '-');
    
    if (!tabsMap.has(tabId)) {

const TAB_META = {
Discover: {
heading: "Where do you want to go?",
sub: "Start here if you're figuring out your path."
},
Prepare: {
heading: "What are you preparing for?",
sub: "Pick the outcome you need - we'll get you ready."
},
Grow: {
heading: "What do you want to get better at?",
sub: "Long-term tools to level up your skills and career."
}
};

tabsMap.set(tabId, {
id: tabId,
label: row.Tab,
icon: '📋',
heading: TAB_META[row.Tab]?.heading || `Explore ${row.Tab}`,
sub: TAB_META[row.Tab]?.sub || '',
tools: [],
});

}

    // Parse resources safely
    let resourcesData = {};
    if (row.resources) {
      try {
        resourcesData = typeof row.resources === 'string' 
          ? JSON.parse(row.resources) 
          : row.resources;
      } catch (err) {
        console.warn(`transformSheetToTabs: Failed to parse resources for "${row.title}"`, err);
      }
    }

    // Map content_type to status
    const statusMap = {
      'live': 'live',
      'beta': 'beta',
      'soon': 'soon',
      'coming_soon': 'soon',
      'coming-soon': 'soon',
    };
    const status = (row.status || 'live').toLowerCase();

    // Map action_type to mode
    const modeMap = {
      'embed': 'embed',
      'external': 'external',
      'new_tab': 'external',
      'new-tab': 'external',
    };
    const mode = modeMap[row.action_type?.toLowerCase()] || 'external';

    // Create tool object
    const tool = {
      icon: row.icon || '🔧',
iconBg: row.iconBg || 'linear-gradient(135deg,#667EEA,#764BA2)',

// Legacy fields (keep temporarily for old renderer)
    name: row.title,
    panelTitle: row.subtitle || row.title,
    category: resourcesData.category || row.content_type || 'General',
    status: status,
    mode: mode,
    link: safeParseResources(row.resources)?.[0]?.link || '#',

    // New clean canonical structure
    title: row.title,
    subtitle: row.subtitle || row.title,
    description: row.description || '',
    content_type: row.content_type || '',
    action_type: row.action_type || '',
    resources: safeParseResources(row.resources),

    chips: row.chips
? row.chips.split('|').map(c => c.trim())
: [],


      // Preserve additional fields from resources
      ...(resourcesData.modules && { modules: resourcesData.modules }),
    };

    tabsMap.get(tabId).tools.push(tool);
  });

  // Convert map to array and return
  return Array.from(tabsMap.values());
}

/**
 * Validates transformed tabs structure
 * @param {Array} tabs - Tabs array to validate
 * @returns {boolean} True if valid, false otherwise
 */
function validateTabs(tabs) {
  if (!Array.isArray(tabs)) return false;

  return tabs.every(tab => {
    const hasRequiredFields = tab.id && tab.label && Array.isArray(tab.tools);
    const toolsValid = tab.tools.every(tool => 
      tool.name && tool.description && tool.status && tool.mode && tool.link
    );
    return hasRequiredFields && toolsValid;
  });
}

/**
 * Example CSV structure expected:
 * Tab | content_type | title | subtitle | description | action_type | resources
 * "Discover" | "live" | "Career Coach" | "I'm not sure..." | "An AI career coach..." | "external" | "{\"icon\":\"🧭\",\"iconBg\":\"linear-gradient(...)\",\"chips\":[...],\"link\":\"...\"}"
 */

// Export for use in Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { transformSheetToTabs, validateTabs };
}
