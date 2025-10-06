// n8n JavaScript Code to Convert Response Text to Notion API Blocks
// This script parses the response.txt content and converts it to proper Notion API block format

// Input: Extract content from the input data
const inputData = $input.all()[0].json;
let responseData;

// Handle different input formats
if (inputData && Array.isArray(inputData) && inputData.length > 0 && inputData[0].output) {
  // Format: [{"output": [document_data]}]
  responseData = inputData[0].output[0];
} else if (inputData && inputData.output && Array.isArray(inputData.output)) {
  // Format: {"output": [document_data]}
  responseData = inputData.output[0];
} else if (inputData && inputData.output) {
  // Format: {"output": document_data}
  responseData = inputData.output;
} else {
  // Fallback: use inputData directly
  responseData = inputData;
}

// Remove unwanted fields from responseData and extract document if needed
if (responseData && typeof responseData === 'object') {
  // Create a clean copy without the rawJsonString field
  const { rawJsonString, ...cleanData } = responseData;
  responseData = cleanData;
  console.log('Removed rawJsonString field from response data');
  
  // Check if responseData has the extraction format with document field
  if (responseData.success && responseData.document) {
    console.log('Found extraction format with document field');
    responseData = responseData.document;
  }
  
  console.log('Final responseData keys:', Object.keys(responseData));
}

const responseText = responseData && typeof responseData === 'object' ? 
  JSON.stringify(responseData, null, 2) : 
  (inputData.content || inputData.response || JSON.stringify(inputData));

function createTextBlock(content, annotations = {}) {
  return {
    type: "text",
    text: {
      content: content
    },
    annotations: {
      bold: false,
      italic: false,
      strikethrough: false,
      underline: false,
      code: false,
      color: "default",
      ...annotations
    }
  };
}

function createHeading(level, content, color = "default") {
  const headingType = `heading_${level}`;
  return {
    object: "block",
    type: headingType,
    [headingType]: {
      rich_text: [createTextBlock(content, { bold: true, color: color })],
      color: color,
      is_toggleable: false
    }
  };
}

function createParagraph(content, annotations = {}) {
  return {
    object: "block",
    type: "paragraph",
    paragraph: {
      rich_text: [createTextBlock(content, annotations)],
      color: "default"
    }
  };
}

function createCallout(content, emoji = "💡", color = "default") {
  return {
    object: "block",
    type: "callout",
    callout: {
      rich_text: [createTextBlock(content)],
      icon: {
        type: "emoji",
        emoji: emoji
      },
      color: color
    }
  };
}

function createBulletedListItem(content, annotations = {}) {
  return {
    object: "block",
    type: "bulleted_list_item",
    bulleted_list_item: {
      rich_text: [createTextBlock(content, annotations)],
      color: "default"
    }
  };
}

function createNumberedListItem(content, annotations = {}) {
  return {
    object: "block",
    type: "numbered_list_item",
    numbered_list_item: {
      rich_text: [createTextBlock(content, annotations)],
      color: "default"
    }
  };
}

function createDivider() {
  return {
    object: "block",
    type: "divider",
    divider: {}
  };
}

function createCodeBlock(content, language = "json") {
  return {
    object: "block",
    type: "code",
    code: {
      rich_text: [createTextBlock(content)],
      language: language,
      caption: []
    }
  };
}

// Parse the response text and convert to Notion blocks
function parseResponseToBlocks(text) {
  const blocks = [];
  const lines = text.split('\n');
  let inCodeBlock = false;
  let codeContent = [];
  let codeLanguage = "json";
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines unless we're in a code block
    if (!line && !inCodeBlock) continue;
    
    // Handle code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        if (codeContent.length > 0) {
          blocks.push(createCodeBlock(codeContent.join('\n'), codeLanguage));
        }
        inCodeBlock = false;
        codeContent = [];
      } else {
        // Start of code block
        inCodeBlock = true;
        codeLanguage = line.replace('```', '') || "json";
      }
      continue;
    }
    
    if (inCodeBlock) {
      codeContent.push(lines[i]); // Keep original formatting in code blocks
      continue;
    }
    
    // Parse different content types
    if (line.startsWith('# ')) {
      // Main heading
      const content = line.replace('# ', '').trim();
      blocks.push(createHeading(1, content, "blue"));
    }
    else if (line.startsWith('## ')) {
      // Section heading
      const content = line.replace('## ', '').trim();
      // Extract emoji and text
      const emojiMatch = content.match(/^([🎯⚡🚀💡🔧📊📈🛡️⭐🔍]+)\s*(.+)/);
      if (emojiMatch) {
        blocks.push(createHeading(2, emojiMatch[2]));
      } else {
        blocks.push(createHeading(2, content));
      }
    }
    else if (line.startsWith('### ')) {
      // Subsection heading
      const content = line.replace('### ', '').trim();
      blocks.push(createHeading(3, content));
    }
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      // Bulleted list item
      const content = line.replace(/^[-*]\s+/, '').trim();
      const isBold = content.includes('**') || content.includes('±') || content.includes('Point ');
      blocks.push(createBulletedListItem(content.replace(/\*\*/g, ''), { bold: isBold }));
    }
    else if (line.match(/^\d+\.\s/)) {
      // Numbered list item
      const content = line.replace(/^\d+\.\s+/, '').trim();
      blocks.push(createNumberedListItem(content));
    }
    else if (line.startsWith('**') && line.endsWith('**')) {
      // Bold paragraph
      const content = line.replace(/\*\*/g, '').trim();
      blocks.push(createParagraph(content, { bold: true }));
    }
    else if (line.includes('🛩️') || line.includes('Revolutionary AI-powered')) {
      // Special callout
      const content = line.replace(/[🛩️]/g, '').trim();
      blocks.push(createCallout(content, "🛩️", "blue_background"));
    }
    else if (line.includes('🚀 Performance Impact:')) {
      // Performance callout
      const content = line.replace('🚀 Performance Impact:', '').trim();
      blocks.push(createCallout(content, "🚀", "green_background"));
    }
    else if (line === '---' || line === '___') {
      // Divider
      blocks.push(createDivider());
    }
    else if (line.length > 0) {
      // Regular paragraph
      const isItalic = line.includes('Precision Computer Vision') || line.includes('System for');
      blocks.push(createParagraph(line, { italic: isItalic, color: isItalic ? "gray" : "default" }));
    }
  }
  
  // Handle case where code block wasn't closed
  if (inCodeBlock && codeContent.length > 0) {
    blocks.push(createCodeBlock(codeContent.join('\n'), codeLanguage));
  }
  
  return blocks;
}

// Check if content already contains Notion blocks JSON
function extractExistingBlocks(text) {
  try {
    // Look for JSON content in code blocks
    const jsonStart = text.indexOf('```json');
    const jsonEnd = text.indexOf('```', jsonStart + 7);
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      const jsonContent = text.substring(jsonStart + 7, jsonEnd).trim();
      const parsedJson = JSON.parse(jsonContent);
      
      if (parsedJson.children && Array.isArray(parsedJson.children)) {
        return parsedJson;
      }
    }
    
    // Try direct JSON parsing
    const directJson = JSON.parse(text);
    if (directJson.children && Array.isArray(directJson.children)) {
      return directJson;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

// Try to extract existing blocks first, otherwise parse the text
const existingBlocks = extractExistingBlocks(responseText);
const notionPayload = existingBlocks || {
  children: parseResponseToBlocks(responseText)
};

// Function to convert structured document data to Notion blocks
function convertDocumentToNotionBlocks(document) {
  const blocks = [];
  
  console.log('Converting structured document to Notion blocks');
  console.log('Document keys:', Object.keys(document));
  
  // Product name as main heading
  if (document.product_name) {
    blocks.push(createHeading(1, document.product_name, "blue"));
    blocks.push(createDivider());
  }
  
  // Product description (if available at root level)
  if (document.description) {
    blocks.push(createCallout(document.description, "📋", "blue_background"));
    blocks.push(createDivider());
  }
  
  // Key capabilities (if available at root level)
  if (document.key_capabilities && Array.isArray(document.key_capabilities)) {
    blocks.push(createHeading(2, "Key Capabilities"));
    document.key_capabilities.forEach(capability => {
      blocks.push(createBulletedListItem(capability));
    });
    blocks.push(createDivider());
  }
  
  // Technical specifications (if available at root level)
  if (document.technical_specifications) {
    blocks.push(createHeading(2, "Technical Specifications"));
    Object.entries(document.technical_specifications).forEach(([key, value]) => {
      const displayValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value;
      blocks.push(createBulletedListItem(`${key.replace(/_/g, ' ')}: ${displayValue}`));
    });
    blocks.push(createDivider());
  }
  
  // Prerequisites section (if available at root level)
  if (document.prerequisites && Array.isArray(document.prerequisites)) {
    blocks.push(createHeading(2, "Prerequisites"));
    document.prerequisites.forEach(prereq => {
      blocks.push(createBulletedListItem(`${prereq.id ? prereq.id.replace(/_/g, ' ') + ': ' : ''}${prereq.description}`));
    });
    blocks.push(createDivider());
  }
  
  // Installation section (if available at root level)
  if (document.installation && Array.isArray(document.installation)) {
    blocks.push(createHeading(2, "Installation"));
    document.installation.forEach((step, index) => {
      blocks.push(createNumberedListItem(step));
    });
    blocks.push(createDivider());
  }
  
  // First run section (if available at root level)
  if (document.first_run && Array.isArray(document.first_run)) {
    blocks.push(createHeading(2, "First Run Setup"));
    document.first_run.forEach((step, index) => {
      blocks.push(createNumberedListItem(step));
    });
    blocks.push(createDivider());
  }
  
  // Measurement setup section (if available at root level)
  if (document.measurement_setup && Array.isArray(document.measurement_setup)) {
    blocks.push(createHeading(2, "Measurement Setup"));
    document.measurement_setup.forEach(step => {
      blocks.push(createNumberedListItem(`Step ${step.step}: ${step.description}`));
      if (step.details && Array.isArray(step.details)) {
        step.details.forEach(detail => {
          blocks.push(createBulletedListItem(detail));
        });
      }
    });
    blocks.push(createDivider());
  }
  
  // Validation process section (if available at root level)
  if (document.validation_process && Array.isArray(document.validation_process)) {
    blocks.push(createHeading(2, "Validation Process"));
    document.validation_process.forEach(step => {
      blocks.push(createNumberedListItem(step));
    });
    blocks.push(createDivider());
  }
  
  // Reporting section (if available at root level)
  if (document.reporting && Array.isArray(document.reporting)) {
    blocks.push(createHeading(2, "Reporting"));
    document.reporting.forEach(step => {
      blocks.push(createNumberedListItem(step));
    });
    blocks.push(createDivider());
  }
  
  // Dashboard usage section (if available at root level)
  if (document.dashboard_usage && Array.isArray(document.dashboard_usage)) {
    blocks.push(createHeading(2, "Dashboard Usage"));
    document.dashboard_usage.forEach(step => {
      blocks.push(createNumberedListItem(step));
    });
    blocks.push(createDivider());
  }
  
  // Overview section (nested structure)
  if (document.overview) {
    blocks.push(createHeading(2, "Overview"));
    
    if (document.overview.description) {
      blocks.push(createCallout(document.overview.description, "📋", "blue_background"));
    }
    
    if (document.overview.key_capabilities && Array.isArray(document.overview.key_capabilities)) {
      blocks.push(createHeading(3, "Key Capabilities"));
      document.overview.key_capabilities.forEach(capability => {
        blocks.push(createBulletedListItem(capability));
      });
    }
    
    if (document.overview.technical_specifications) {
      blocks.push(createHeading(3, "Technical Specifications"));
      Object.entries(document.overview.technical_specifications).forEach(([key, value]) => {
        const displayValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value;
        blocks.push(createBulletedListItem(`${key.replace(/_/g, ' ')}: ${displayValue}`));
      });
    }
    
    blocks.push(createDivider());
  }
  
  // Getting Started section (nested structure)
  if (document.get_started) {
    blocks.push(createHeading(2, "Getting Started"));
    
    if (document.get_started.prerequisites && Array.isArray(document.get_started.prerequisites)) {
      blocks.push(createHeading(3, "Prerequisites"));
      document.get_started.prerequisites.forEach(prereq => {
        blocks.push(createBulletedListItem(`${prereq.id ? prereq.id.replace(/_/g, ' ') + ': ' : ''}${prereq.description}`));
      });
    }
    
    if (document.get_started.installation && Array.isArray(document.get_started.installation)) {
      blocks.push(createHeading(3, "Installation"));
      document.get_started.installation.forEach((step, index) => {
        blocks.push(createNumberedListItem(step));
      });
    }
    
    if (document.get_started.first_run && Array.isArray(document.get_started.first_run)) {
      blocks.push(createHeading(3, "First Run Setup"));
      document.get_started.first_run.forEach((step, index) => {
        blocks.push(createNumberedListItem(step));
      });
    }
    
    blocks.push(createDivider());
  }
  
  // How to Use section (nested structure)
  if (document.how_to_use) {
    blocks.push(createHeading(2, "How to Use"));
    
    if (document.how_to_use.measurement_setup && Array.isArray(document.how_to_use.measurement_setup)) {
      blocks.push(createHeading(3, "Measurement Setup"));
      document.how_to_use.measurement_setup.forEach(step => {
        blocks.push(createNumberedListItem(`Step ${step.step}: ${step.description}`));
        if (step.details && Array.isArray(step.details)) {
          step.details.forEach(detail => {
            blocks.push(createBulletedListItem(detail));
          });
        }
      });
    }
    
    if (document.how_to_use.validation_process && Array.isArray(document.how_to_use.validation_process)) {
      blocks.push(createHeading(3, "Validation Process"));
      document.how_to_use.validation_process.forEach(step => {
        blocks.push(createNumberedListItem(step));
      });
    }
    
    if (document.how_to_use.reporting && Array.isArray(document.how_to_use.reporting)) {
      blocks.push(createHeading(3, "Reporting"));
      document.how_to_use.reporting.forEach(step => {
        blocks.push(createNumberedListItem(step));
      });
    }
    
    if (document.how_to_use.dashboard_usage && Array.isArray(document.how_to_use.dashboard_usage)) {
      blocks.push(createHeading(3, "Dashboard Usage"));
      document.how_to_use.dashboard_usage.forEach(step => {
        blocks.push(createNumberedListItem(step));
      });
    }
    
    blocks.push(createDivider());
  }
  
  // Troubleshooting section
  if (document.troubleshooting && Array.isArray(document.troubleshooting)) {
    blocks.push(createHeading(2, "Troubleshooting"));
    document.troubleshooting.forEach(issue => {
      blocks.push(createHeading(3, issue.description));
      
      if (issue.symptoms && Array.isArray(issue.symptoms)) {
        blocks.push(createParagraph("Symptoms:", { bold: true }));
        issue.symptoms.forEach(symptom => {
          blocks.push(createBulletedListItem(symptom));
        });
      }
      
      if (issue.resolution && Array.isArray(issue.resolution)) {
        blocks.push(createParagraph("Resolution:", { bold: true }));
        issue.resolution.forEach(step => {
          blocks.push(createNumberedListItem(step));
        });
      }
    });
    blocks.push(createDivider());
  }
  
  // Edge cases and troubleshooting section (alternative naming)
  if (document.edge_cases_and_troubleshooting && Array.isArray(document.edge_cases_and_troubleshooting)) {
    blocks.push(createHeading(2, "Troubleshooting"));
    document.edge_cases_and_troubleshooting.forEach(issue => {
      blocks.push(createHeading(3, issue.description));
      
      if (issue.symptoms && Array.isArray(issue.symptoms)) {
        blocks.push(createParagraph("Symptoms:", { bold: true }));
        issue.symptoms.forEach(symptom => {
          blocks.push(createBulletedListItem(symptom));
        });
      }
      
      if (issue.resolution && Array.isArray(issue.resolution)) {
        blocks.push(createParagraph("Resolution:", { bold: true }));
        issue.resolution.forEach(step => {
          blocks.push(createNumberedListItem(step));
        });
      }
    });
    blocks.push(createDivider());
  }
  
  // Integration section
  if (document.integration) {
    blocks.push(createHeading(2, "Integration"));
    
    if (document.integration.erp_export) {
      blocks.push(createHeading(3, "ERP Export"));
      blocks.push(createParagraph(document.integration.erp_export.description));
      
      if (document.integration.erp_export.endpoints && Array.isArray(document.integration.erp_export.endpoints)) {
        blocks.push(createHeading(4, "API Endpoints"));
        document.integration.erp_export.endpoints.forEach(endpoint => {
          blocks.push(createBulletedListItem(`${endpoint.method} ${endpoint.url}`));
          if (endpoint.payload) {
            blocks.push(createCodeBlock(JSON.stringify(endpoint.payload, null, 2), "json"));
          }
        });
      }
    }
    
    if (document.integration.qms_integration) {
      blocks.push(createHeading(3, "QMS Integration"));
      blocks.push(createParagraph(document.integration.qms_integration.description));
      
      if (document.integration.qms_integration.methods && Array.isArray(document.integration.qms_integration.methods)) {
        blocks.push(createParagraph("Supported Methods:"));
        document.integration.qms_integration.methods.forEach(method => {
          blocks.push(createBulletedListItem(method));
        });
      }
    }
    
    if (document.integration.api_reference) {
      blocks.push(createHeading(3, "API Reference"));
      if (document.integration.api_reference.base_url) {
        blocks.push(createParagraph(`Base URL: ${document.integration.api_reference.base_url}`));
      }
      if (document.integration.api_reference.endpoints && Array.isArray(document.integration.api_reference.endpoints)) {
        blocks.push(createParagraph("Available Endpoints:"));
        document.integration.api_reference.endpoints.forEach(endpoint => {
          blocks.push(createBulletedListItem(endpoint));
        });
      }
    }
    
    blocks.push(createDivider());
  }
  
  // FAQ section
  if (document.faq && Array.isArray(document.faq)) {
    blocks.push(createHeading(2, "Frequently Asked Questions"));
    document.faq.forEach(item => {
      blocks.push(createHeading(3, item.question));
      blocks.push(createParagraph(item.answer));
    });
  }
  
  console.log(`Generated ${blocks.length} blocks`);
  
  return {
    children: blocks
  };
}

// Additional helper functions for specific JEBS content
function createJEBSSpecificBlocks() {
  const jebsBlocks = [
    createHeading(1, "Jet Engine Blade Scan (JEBS)", "blue"),
    createParagraph("Precision Computer Vision System for Aerospace Quality Control", { italic: true, color: "gray" }),
    createCallout(
      "Revolutionary AI-powered measurement system delivering sub-millimeter accuracy for jet engine blade inspection. Streamline your quality control process with automated scanning, real-time analysis, and seamless CAD integration.",
      "🛩️",
      "blue_background"
    ),
    createDivider(),
    createHeading(2, "Hero Zone - Transform Your Quality Control"),
    createParagraph("Eliminate manual measurement errors and reduce inspection time by 85% with our cutting-edge computer vision technology. JEBS automatically captures, analyzes, and validates critical blade dimensions with unprecedented accuracy."),
    createBulletedListItem("Sub-millimeter precision measurement (±0.05mm accuracy)", { bold: true }),
    createBulletedListItem("Automated pass/fail determination with instant reporting", { bold: true }),
    createBulletedListItem("Seamless CAD model integration for real-time comparison", { bold: true }),
    createDivider(),
    createHeading(2, "Features & Benefits Zone - Advanced Capabilities"),
    createHeading(3, "Multi-Point Measurement System"),
    createParagraph("Our system captures 8+ critical measurement points on each blade, including vertical offsets, angles, and dimensional accuracy checks:"),
    createNumberedListItem("Point N: Leading edge thickness validation"),
    createNumberedListItem("Point F & K: Critical airfoil geometry points"),
    createNumberedListItem("Point H: Trailing edge precision measurements"),
    createNumberedListItem("Point G & L: Overall blade dimensional verification"),
    createNumberedListItem("Point M: Surface profile accuracy"),
    createNumberedListItem("Point J: Angular measurements and blade twist verification"),
    createHeading(3, "Real-Time Processing & Analysis"),
    createParagraph("Advanced computer vision algorithms process blade images in real-time, comparing measurements against CAD specifications and providing instant pass/fail results with detailed deviation analysis."),
    createCallout("Reduce inspection time from 45 minutes to 6 minutes per blade while improving accuracy by 300%", "🚀", "green_background")
  ];
  
  return {
    children: jebsBlocks
  };
}

// Process the response data
try {
  let finalBlocks;
  
  // Check if we have structured document data
  console.log('Checking for structured data...');
  console.log('responseData type:', typeof responseData);
  console.log('responseData keys:', responseData && typeof responseData === 'object' ? Object.keys(responseData) : 'not an object');
  
  if (responseData && (
    responseData.product_name || 
    responseData.overview || 
    responseData.get_started || 
    responseData.description ||
    responseData.key_capabilities ||
    responseData.technical_specifications ||
    responseData.prerequisites ||
    responseData.installation ||
    responseData.first_run ||
    responseData.measurement_setup ||
    responseData.validation_process ||
    responseData.reporting ||
    responseData.dashboard_usage ||
    responseData.troubleshooting ||
    responseData.integration ||
    responseData.faq
  )) {
    console.log('Found structured document data, converting to Notion blocks');
    // We have structured data, convert it to Notion blocks
    finalBlocks = convertDocumentToNotionBlocks(responseData);
  } else {
    console.log('No structured data found, falling back to text parsing');
    // Fall back to text parsing
    const existingBlocks = extractExistingBlocks(responseText);
    finalBlocks = existingBlocks || {
      children: parseResponseToBlocks(responseText)
    };
  }
  
  // Return the final result
  return finalBlocks;
  
} catch (error) {
  console.log('Error processing response:', error.message);
  return {
    children: [
      {
        type: "callout",
        callout: {
          rich_text: [{
            type: "text",
            text: { content: `Error processing response: ${error.message}` },
            annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false, color: "default" },
            plain_text: `Error processing response: ${error.message}`,
            href: null
          }],
          icon: { type: "emoji", emoji: "❌" },
          color: "red_background"
        }
      }
    ]
  };
}