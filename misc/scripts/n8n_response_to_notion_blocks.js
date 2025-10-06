// n8n script to convert response documents to Notion blocks
// Input: Raw text or response array with document structure
// Output: Notion blocks array for API

// Helper function to extract JSON from text
function extractJSONFromText(text) {
  if (!text || typeof text !== 'string') {
    return null;
  }

  // Clean the text for better JSON parsing
  function cleanJSON(str) {
    return str
      // Remove trailing commas before closing brackets/braces
      .replace(/,(\s*[}\]])/g, '$1')
      // Remove JavaScript comments
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
      // Fix property names without quotes
      .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
      // Remove control characters but preserve newlines in strings
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
      // Fix single quotes to double quotes (but be careful with apostrophes)
      .replace(/'/g, '"')
      // Remove extra whitespace
      .replace(/\s+/g, ' ');
  }

  // More comprehensive patterns for JSON extraction
  const patterns = [
    // Complete JSON arrays (highest priority)
    /(\[\s*\{[\s\S]*?\}\s*\])/g,
    // JSON in markdown code blocks
    /```(?:json|javascript)?\s*(\{[\s\S]*?\})\s*```/gi,
    /```(?:json|javascript)?\s*(\[[\s\S]*?\])\s*```/gi,
    // JSON objects with proper structure
    /(\{\s*"[^"]+"\s*:\s*[\s\S]*?\})/g,
    // Large JSON structures (greedy)
    /(\{[\s\S]{100,}?\})/g,
    /(\[[\s\S]{50,}?\])/g,
    // Smaller JSON structures
    /(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})/g,
    /(\[[^\[\]]*(?:\[[^\[\]]*\][^\[\]]*)*\])/g
  ];

  // Try each pattern
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      // Sort matches by length (longest first)
      matches.sort((a, b) => b.length - a.length);
      
      for (const match of matches) {
        try {
          // Clean up the match
          let cleanMatch = match.replace(/```(?:json|javascript)?\s*/gi, '').replace(/```\s*$/gi, '').trim();
          
          // Try multiple cleaning strategies
          const cleaningAttempts = [
            cleanMatch, // Original
            cleanJSON(cleanMatch), // Basic cleaning
            cleanMatch.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']'), // Remove trailing commas
            cleanMatch.replace(/([{,]\s*)(\w+):/g, '$1"$2":'), // Quote property names
          ];
          
          for (const attempt of cleaningAttempts) {
            try {
              const parsed = JSON.parse(attempt);
              if (parsed && (Array.isArray(parsed) || typeof parsed === 'object')) {
                // Validate it contains useful data
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                if (typeof parsed === 'object' && Object.keys(parsed).length > 0) return parsed;
              }
            } catch (e) {
              continue;
            }
          }
        } catch (e) {
          continue;
        }
      }
    }
  }

  // Last resort: try to find JSON-like content line by line
  const lines = text.split('\n');
  let jsonStart = -1;
  let braceCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('{') || line.startsWith('[')) {
      if (jsonStart === -1) jsonStart = i;
    }
    
    // Count braces to find complete JSON objects
    for (const char of line) {
      if (char === '{' || char === '[') braceCount++;
      if (char === '}' || char === ']') braceCount--;
    }
    
    // If we found a complete JSON structure
    if (jsonStart !== -1 && braceCount === 0) {
      try {
        const jsonCandidate = lines.slice(jsonStart, i + 1).join('\n');
        const cleaned = cleanJSON(jsonCandidate);
        const parsed = JSON.parse(cleaned);
        if (parsed && (Array.isArray(parsed) || typeof parsed === 'object')) {
          return parsed;
        }
      } catch (e) {
        // Reset and continue
        jsonStart = -1;
        braceCount = 0;
      }
    }
  }

  return null;
}

// Helper function to create rich text objects
function createRichText(text, annotations = {}) {
  return [{
    type: "text",
    text: {
      content: text
    },
    annotations: {
      bold: annotations.bold || false,
      italic: annotations.italic || false,
      strikethrough: annotations.strikethrough || false,
      underline: annotations.underline || false,
      code: annotations.code || false,
      color: annotations.color || "default"
    },
    plain_text: text,
    href: annotations.href || null
  }];
}

// Helper function to create heading blocks
function createHeading(level, text, color = "default") {
  const headingType = `heading_${level}`;
  const block = {
    type: headingType,
    [headingType]: {
      rich_text: createRichText(text, { bold: true }),
      color: color
    }
  };
  return block;
}

// Helper function to create paragraph blocks
function createParagraph(text, color = "default") {
  return {
    type: "paragraph",
    paragraph: {
      rich_text: createRichText(text),
      color: color
    }
  };
}

// Helper function to create bulleted list items
function createBulletedListItem(text, children = []) {
  return {
    type: "bulleted_list_item",
    bulleted_list_item: {
      rich_text: createRichText(text),
      children: children
    }
  };
}

// Helper function to create numbered list items
function createNumberedListItem(text, children = []) {
  return {
    type: "numbered_list_item",
    numbered_list_item: {
      rich_text: createRichText(text),
      children: children
    }
  };
}

// Helper function to create callout blocks
function createCallout(text, icon = "ℹ️", color = "blue_background") {
  return {
    type: "callout",
    callout: {
      rich_text: createRichText(text),
      icon: {
        type: "emoji",
        emoji: icon
      },
      color: color
    }
  };
}

// Helper function to create toggle blocks
function createToggle(title, children = []) {
  return {
    type: "toggle",
    toggle: {
      rich_text: createRichText(title, { bold: true }),
      children: children
    }
  };
}

// Helper function to create code blocks
function createCodeBlock(code, language = "javascript") {
  return {
    type: "code",
    code: {
      rich_text: createRichText(code),
      language: language
    }
  };
}

// Helper function to create divider
function createDivider() {
  return {
    type: "divider",
    divider: {}
  };
}

// Process overview section
function processOverview(overview) {
  const blocks = [];
  
  // Product description
  if (overview.description) {
    blocks.push(createCallout(overview.description, "📋", "blue_background"));
  }
  
  // Key capabilities
  if (overview.key_capabilities && overview.key_capabilities.length > 0) {
    blocks.push(createHeading(3, "Key Capabilities"));
    overview.key_capabilities.forEach(capability => {
      blocks.push(createBulletedListItem(capability));
    });
  }
  
  // Technical specifications
  if (overview.technical_specifications) {
    blocks.push(createHeading(3, "Technical Specifications"));
    const specs = overview.technical_specifications;
    Object.keys(specs).forEach(key => {
      const value = typeof specs[key] === 'boolean' ? (specs[key] ? 'Yes' : 'No') : specs[key];
      blocks.push(createBulletedListItem(`${key.replace(/_/g, ' ')}: ${value}`));
    });
  }
  
  return blocks;
}

// Process getting started section
function processGettingStarted(getStarted) {
  const blocks = [];
  
  // Prerequisites
  if (getStarted.prerequisites && getStarted.prerequisites.length > 0) {
    blocks.push(createHeading(3, "Prerequisites"));
    getStarted.prerequisites.forEach(prereq => {
      const title = prereq.id ? `${prereq.id.charAt(0).toUpperCase() + prereq.id.slice(1)}` : "Requirement";
      const children = [createParagraph(prereq.description)];
      blocks.push(createToggle(title, children));
    });
  }
  
  // Installation steps
  if (getStarted.installation && getStarted.installation.length > 0) {
    blocks.push(createHeading(3, "Installation"));
    getStarted.installation.forEach((step, index) => {
      blocks.push(createNumberedListItem(step));
    });
  }
  
  // First run steps
  if (getStarted.first_run && getStarted.first_run.length > 0) {
    blocks.push(createHeading(3, "First Run Setup"));
    getStarted.first_run.forEach((step, index) => {
      blocks.push(createNumberedListItem(step));
    });
  }
  
  return blocks;
}

// Process how to use section
function processHowToUse(howToUse) {
  const blocks = [];
  
  // Measurement setup
  if (howToUse.measurement_setup && howToUse.measurement_setup.length > 0) {
    blocks.push(createHeading(3, "Measurement Setup"));
    howToUse.measurement_setup.forEach(step => {
      const stepText = `Step ${step.step}: ${step.description}`;
      const children = [];
      
      if (step.details && step.details.length > 0) {
        step.details.forEach(detail => {
          children.push(createBulletedListItem(detail));
        });
      }
      
      blocks.push(createToggle(stepText, children));
    });
  }
  
  // Validation process
  if (howToUse.validation_process && howToUse.validation_process.length > 0) {
    blocks.push(createHeading(3, "Validation Process"));
    howToUse.validation_process.forEach(step => {
      blocks.push(createNumberedListItem(step));
    });
  }
  
  // Reporting
  if (howToUse.reporting && howToUse.reporting.length > 0) {
    blocks.push(createHeading(3, "Reporting"));
    howToUse.reporting.forEach(step => {
      blocks.push(createNumberedListItem(step));
    });
  }
  
  // Dashboard usage
  if (howToUse.dashboard_usage && howToUse.dashboard_usage.length > 0) {
    blocks.push(createHeading(3, "Dashboard Usage"));
    howToUse.dashboard_usage.forEach(step => {
      blocks.push(createNumberedListItem(step));
    });
  }
  
  return blocks;
}

// Process troubleshooting section
function processTroubleshooting(troubleshooting) {
  const blocks = [];
  
  troubleshooting.forEach(issue => {
    const title = `${issue.description}`;
    const children = [];
    
    // Add symptoms
    if (issue.symptoms && issue.symptoms.length > 0) {
      children.push(createParagraph("Symptoms:", { bold: true }));
      issue.symptoms.forEach(symptom => {
        children.push(createBulletedListItem(symptom));
      });
    }
    
    // Add resolution steps
    if (issue.resolution && issue.resolution.length > 0) {
      children.push(createParagraph("Resolution:", { bold: true }));
      issue.resolution.forEach((step, index) => {
        children.push(createNumberedListItem(step));
      });
    }
    
    blocks.push(createToggle(title, children));
  });
  
  return blocks;
}

// Process integration section
function processIntegration(integration) {
  const blocks = [];
  
  // API Reference
  if (integration.api_reference) {
    blocks.push(createHeading(3, "API Reference"));
    if (integration.api_reference.base_url) {
      blocks.push(createParagraph(`Base URL: ${integration.api_reference.base_url}`));
    }
    
    if (integration.api_reference.endpoints && integration.api_reference.endpoints.length > 0) {
      blocks.push(createParagraph("Available Endpoints:"));
      integration.api_reference.endpoints.forEach(endpoint => {
        blocks.push(createBulletedListItem(endpoint));
      });
    }
  }
  
  // ERP Export
  if (integration.erp_export) {
    const erpChildren = [];
    erpChildren.push(createParagraph(integration.erp_export.description));
    
    if (integration.erp_export.endpoints && integration.erp_export.endpoints.length > 0) {
      integration.erp_export.endpoints.forEach(endpoint => {
        erpChildren.push(createParagraph(`URL: ${endpoint.url}`));
        erpChildren.push(createParagraph(`Method: ${endpoint.method}`));
        erpChildren.push(createParagraph(`Auth: ${endpoint.auth}`));
        
        if (endpoint.payload) {
          erpChildren.push(createParagraph("Payload Structure:"));
          erpChildren.push(createCodeBlock(JSON.stringify(endpoint.payload, null, 2), "json"));
        }
      });
    }
    
    blocks.push(createToggle("ERP Export Integration", erpChildren));
  }
  
  // QMS Integration
  if (integration.qms_integration) {
    const qmsChildren = [];
    qmsChildren.push(createParagraph(integration.qms_integration.description));
    
    if (integration.qms_integration.methods && integration.qms_integration.methods.length > 0) {
      qmsChildren.push(createParagraph("Supported Methods:"));
      integration.qms_integration.methods.forEach(method => {
        qmsChildren.push(createBulletedListItem(method));
      });
    }
    
    blocks.push(createToggle("QMS Integration", qmsChildren));
  }
  
  return blocks;
}

// Process FAQ section
function processFAQ(faq) {
  const blocks = [];
  
  faq.forEach(item => {
    const children = [createParagraph(item.answer)];
    blocks.push(createToggle(item.question, children));
  });
  
  return blocks;
}

// Main processing function
function convertResponseToNotionBlocks(responseData) {
  const blocks = [];
  
  try {
    let data = responseData;
    
    // If input is a string, try to extract JSON from it
    if (typeof responseData === 'string') {
      const extractedJSON = extractJSONFromText(responseData);
      if (!extractedJSON) {
        throw new Error("Could not extract valid JSON from input text");
      }
      data = extractedJSON;
    }
    
    // Handle array input (from n8n)
    if (Array.isArray(data)) {
      data = data[0];
    }
    
    // Comprehensive document extraction with error handling
    let document = null;
    
    console.log("=== DOCUMENT EXTRACTION DEBUG ===");
    console.log("Data type:", typeof data);
    console.log("Is array:", Array.isArray(data));
    
    if (data && typeof data === 'object') {
      console.log("Data keys:", Object.keys(data));
      console.log("Data sample:", JSON.stringify(data, null, 2).substring(0, 500));
    }
    
    // Comprehensive extraction patterns
    const extractionPatterns = [
      // Standard patterns
      () => data?.output?.[0]?.document,
      () => data?.[0]?.output?.[0]?.document,
      () => data?.document,
      () => data?.output?.document,
      
      // Direct document patterns
      () => (data?.product_name || data?.overview || data?.get_started) ? data : null,
      () => Array.isArray(data) && data[0] && (data[0].product_name || data[0].overview || data[0].get_started) ? data[0] : null,
      
      // Response wrapper patterns
      () => data?.response?.document,
      () => data?.data?.document,
      () => data?.result?.document,
      () => data?.content?.document,
      
      // Nested search patterns
      () => {
        function deepSearch(obj, depth = 0) {
          if (depth > 5 || !obj || typeof obj !== 'object') return null;
          
          // Check if current object looks like a document
          if (obj.product_name || obj.overview || obj.get_started || 
              obj.how_to_use || obj.integration || obj.faq) {
            return obj;
          }
          
          // Search in all object properties
          for (const [key, value] of Object.entries(obj)) {
            if (value && typeof value === 'object') {
              const found = deepSearch(value, depth + 1);
              if (found) return found;
            }
          }
          
          return null;
        }
        return deepSearch(data);
      }
    ];
    
    // Try each pattern
    for (let i = 0; i < extractionPatterns.length; i++) {
      try {
        const result = extractionPatterns[i]();
        if (result && typeof result === 'object') {
          console.log(`Pattern ${i + 1} succeeded`);
          document = result;
          break;
        }
      } catch (e) {
        console.log(`Pattern ${i + 1} failed:`, e.message);
        continue;
      }
    }
    
    // Final validation and fallback
    if (!document) {
      console.log("=== ALL PATTERNS FAILED ===");
      console.log("Attempting fallback with any object that has content...");
      
      // Last resort: look for any object with meaningful content
      function hasContent(obj) {
        if (!obj || typeof obj !== 'object') return false;
        const keys = Object.keys(obj);
        return keys.length > 2 && (
          keys.some(k => typeof obj[k] === 'string' && obj[k].length > 10) ||
          keys.some(k => Array.isArray(obj[k]) && obj[k].length > 0) ||
          keys.some(k => typeof obj[k] === 'object' && obj[k] !== null)
        );
      }
      
      if (hasContent(data)) {
        console.log("Using data as document (fallback)");
        document = data;
      } else if (Array.isArray(data) && data[0] && hasContent(data[0])) {
        console.log("Using data[0] as document (fallback)");
        document = data[0];
      } else {
        console.log("=== COMPLETE FAILURE ===");
        console.log("Full input data:", JSON.stringify(data, null, 2));
        throw new Error(`No valid document structure found. Input type: ${typeof data}, Keys: ${data && typeof data === 'object' ? Object.keys(data).join(', ') : 'none'}`);
      }
    }
    
    console.log("=== DOCUMENT FOUND ===");
    console.log("Document type:", typeof document);
    console.log("Document keys:", document && typeof document === 'object' ? Object.keys(document) : 'not an object');
    console.log("Document preview:", JSON.stringify(document, null, 2).substring(0, 300));
    
    // Build blocks from document with error handling
    console.log("=== BUILDING BLOCKS ===");
    
    // Product name as main heading
    if (document.product_name) {
      console.log("Adding product name:", document.product_name);
      blocks.push(createHeading(1, document.product_name));
      blocks.push(createDivider());
    } else {
      console.log("No product_name found");
      // Add generic title if no product name
      blocks.push(createHeading(1, "Documentation"));
      blocks.push(createDivider());
    }
    
    // Overview section
    if (document.overview) {
      console.log("Processing overview section");
      try {
        blocks.push(createHeading(2, "Overview"));
        blocks.push(...processOverview(document.overview));
        blocks.push(createDivider());
      } catch (e) {
        console.log("Error processing overview:", e.message);
        blocks.push(createCallout(`Error processing overview: ${e.message}`, "⚠️", "yellow_background"));
      }
    }
    
    // Getting Started section
    if (document.get_started) {
      console.log("Processing get_started section");
      try {
        blocks.push(createHeading(2, "Getting Started"));
        blocks.push(...processGettingStarted(document.get_started));
        blocks.push(createDivider());
      } catch (e) {
        console.log("Error processing get_started:", e.message);
        blocks.push(createCallout(`Error processing getting started: ${e.message}`, "⚠️", "yellow_background"));
      }
    }
    
    // How to Use section
    if (document.how_to_use) {
      console.log("Processing how_to_use section");
      try {
        blocks.push(createHeading(2, "How to Use"));
        blocks.push(...processHowToUse(document.how_to_use));
        blocks.push(createDivider());
      } catch (e) {
        console.log("Error processing how_to_use:", e.message);
        blocks.push(createCallout(`Error processing how to use: ${e.message}`, "⚠️", "yellow_background"));
      }
    }
    
    // Troubleshooting section
    if (document.edge_cases_and_troubleshooting) {
      console.log("Processing troubleshooting section");
      try {
        blocks.push(createHeading(2, "Troubleshooting"));
        blocks.push(...processTroubleshooting(document.edge_cases_and_troubleshooting));
        blocks.push(createDivider());
      } catch (e) {
        console.log("Error processing troubleshooting:", e.message);
        blocks.push(createCallout(`Error processing troubleshooting: ${e.message}`, "⚠️", "yellow_background"));
      }
    }
    
    // Integration section
    if (document.integration) {
      console.log("Processing integration section");
      try {
        blocks.push(createHeading(2, "Integration"));
        blocks.push(...processIntegration(document.integration));
        blocks.push(createDivider());
      } catch (e) {
        console.log("Error processing integration:", e.message);
        blocks.push(createCallout(`Error processing integration: ${e.message}`, "⚠️", "yellow_background"));
      }
    }
    
    // FAQ section
    if (document.faq) {
      console.log("Processing FAQ section");
      try {
        blocks.push(createHeading(2, "Frequently Asked Questions"));
        blocks.push(...processFAQ(document.faq));
      } catch (e) {
        console.log("Error processing FAQ:", e.message);
        blocks.push(createCallout(`Error processing FAQ: ${e.message}`, "⚠️", "yellow_background"));
      }
    }
    
    // If no content was added, create basic content from available data
    if (blocks.length <= 2) { // Only title and divider
      console.log("No structured sections found, creating basic content");
      blocks.push(createHeading(2, "Content"));
      
      // Try to extract any meaningful content
      for (const [key, value] of Object.entries(document)) {
        if (value && typeof value === 'string' && value.length > 10) {
          blocks.push(createHeading(3, key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())));
          blocks.push(createParagraph(value));
        } else if (Array.isArray(value) && value.length > 0) {
          blocks.push(createHeading(3, key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())));
          value.forEach(item => {
            if (typeof item === 'string') {
              blocks.push(createBulletedListItem(item));
            } else if (item && typeof item === 'object') {
              blocks.push(createBulletedListItem(JSON.stringify(item)));
            }
          });
        }
      }
    }
    
    console.log("=== BLOCKS COMPLETED ===");
    console.log("Total blocks created:", blocks.length);
    
    return {
      children: blocks
    };
    
  } catch (error) {
    return {
      error: `Conversion failed: ${error.message}`,
      children: [
        createCallout(`Error converting response: ${error.message}`, "❌", "red_background")
      ]
    };
  }
}

// n8n execution
try {
  // Get input data from n8n - handle different input formats
  const inputItem = $input.all()[0];
  let inputData;
  
  // Handle different input structures
  if (inputItem && inputItem.json) {
    // Standard n8n JSON input
    inputData = inputItem.json;
    
    // Check if it's nested (common in n8n workflows)
    if (inputData.output) {
      inputData = inputData.output;
    }
    if (typeof inputData === 'string') {
      // If json field contains string, extract JSON from it
      const extracted = extractJSONFromText(inputData);
      if (extracted) inputData = extracted;
    }
  } else if (inputItem && inputItem.binary && inputItem.binary.data) {
    // Handle binary data
    inputData = inputItem.binary.data.toString();
    const extracted = extractJSONFromText(inputData);
    if (extracted) inputData = extracted;
  } else if (typeof inputItem === 'string') {
    // Direct string input
    const extracted = extractJSONFromText(inputItem);
    inputData = extracted || inputItem;
  } else if (inputItem && typeof inputItem === 'object') {
    // Direct object input
    inputData = inputItem;
  } else {
    // Fallback
    inputData = inputItem;
  }
  
  // Additional debug info
  console.log("=== DEBUG INFO ===");
  console.log("Original input type:", typeof inputItem);
  console.log("Processed input type:", typeof inputData);
  console.log("Input preview:", typeof inputData === 'string' ? 
    inputData.substring(0, 300) + '...' : 
    JSON.stringify(inputData).substring(0, 300) + '...');
  
  // If we still have a string, try one more extraction
  if (typeof inputData === 'string') {
    const finalExtraction = extractJSONFromText(inputData);
    if (finalExtraction) {
      console.log("Successfully extracted JSON from string input");
      inputData = finalExtraction;
    } else {
      console.log("Could not extract JSON from string input");
    }
  }
  
  console.log("Final input type:", typeof inputData);
  console.log("Final input structure:", Array.isArray(inputData) ? 'array' : 
    inputData && typeof inputData === 'object' ? 'object' : typeof inputData);
  
  const result = convertResponseToNotionBlocks(inputData);
  
  return result;
  
} catch (error) {
  console.log("Script error:", error.message);
  console.log("Error stack:", error.stack);
  
  return {
    error: `Script execution failed: ${error.message}`,
    children: [
      {
        type: "callout",
        callout: {
          rich_text: [{
            type: "text",
            text: { content: `Error: ${error.message}` },
            annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false, color: "default" },
            plain_text: `Error: ${error.message}`,
            href: null
          }],
          icon: { type: "emoji", emoji: "❌" },
          color: "red_background"
        }
      }
    ]
  };
}