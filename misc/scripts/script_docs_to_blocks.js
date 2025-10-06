// n8n script to convert response documents to Notion blocks
// Input: Response array with document structure
// Output: Notion blocks array for API

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
function createParagraph(text, options = {}) {
  // Handle both old color parameter and new options object
  let color = "default";
  let annotations = {};
  
  if (typeof options === 'string') {
    // Old usage: createParagraph(text, "blue")
    color = options;
  } else if (typeof options === 'object' && options !== null) {
    // New usage: createParagraph(text, { color: "blue", bold: true })
    color = options.color || "default";
    annotations = {
      bold: options.bold || false,
      italic: options.italic || false,
      strikethrough: options.strikethrough || false,
      underline: options.underline || false,
      code: options.code || false
    };
  }
  
  return {
    type: "paragraph",
    paragraph: {
      rich_text: createRichText(text, annotations),
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
      children.push(createParagraph("Symptoms:", { bold: true, color: "default" }));
      issue.symptoms.forEach(symptom => {
        children.push(createBulletedListItem(symptom));
      });
    }
    
    // Add resolution steps
    if (issue.resolution && issue.resolution.length > 0) {
      children.push(createParagraph("Resolution:", { bold: true, color: "default" }));
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
    // Handle array input (from n8n)
    const data = Array.isArray(responseData) ? responseData[0] : responseData;
    
    if (!data || !data.output) {
      throw new Error("Invalid response format: missing output array");
    }
    
    const output = Array.isArray(data.output) ? data.output[0] : data.output;
    
    if (!output || !output.document) {
      throw new Error("Invalid response format: missing document object");
    }
    
    const document = output.document;
    
    // Product name as main heading
    if (document.product_name) {
      blocks.push(createHeading(1, document.product_name));
      blocks.push(createDivider());
    }
    
    // Overview section
    if (document.overview) {
      blocks.push(createHeading(2, "Overview"));
      blocks.push(...processOverview(document.overview));
      blocks.push(createDivider());
    }
    
    // Getting Started section
    if (document.get_started) {
      blocks.push(createHeading(2, "Getting Started"));
      blocks.push(...processGettingStarted(document.get_started));
      blocks.push(createDivider());
    }
    
    // How to Use section
    if (document.how_to_use) {
      blocks.push(createHeading(2, "How to Use"));
      blocks.push(...processHowToUse(document.how_to_use));
      blocks.push(createDivider());
    }
    
    // Troubleshooting section
    if (document.edge_cases_and_troubleshooting) {
      blocks.push(createHeading(2, "Troubleshooting"));
      blocks.push(...processTroubleshooting(document.edge_cases_and_troubleshooting));
      blocks.push(createDivider());
    }
    
    // Integration section
    if (document.integration) {
      blocks.push(createHeading(2, "Integration"));
      blocks.push(...processIntegration(document.integration));
      blocks.push(createDivider());
    }
    
    // FAQ section
    if (document.faq) {
      blocks.push(createHeading(2, "Frequently Asked Questions"));
      blocks.push(...processFAQ(document.faq));
    }
    
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
const inputData = $input.all()[0].json;
const result = convertResponseToNotionBlocks(inputData);

return result;