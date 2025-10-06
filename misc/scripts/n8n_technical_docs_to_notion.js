// n8n JavaScript Code for converting structured documentation to Notion blocks
// Handles various documentation formats: product docs, technical guides, user manuals

// Get input data - expects the parsed response format
const inputData = $input.all()[0].json;

console.log('Processing documentation conversion to Notion blocks...');

if (!inputData || !inputData.document) {
  throw new Error('Invalid input: Expected document structure not found');
}

const document = inputData.document;

/**
 * Convert text content to Notion rich text format
 */
function createRichText(text, annotations = {}) {
  if (!text) return [];
  
  return [{
    type: 'text',
    text: { content: String(text) },
    annotations: {
      bold: annotations.bold || false,
      italic: annotations.italic || false,
      strikethrough: annotations.strikethrough || false,
      underline: annotations.underline || false,
      code: annotations.code || false,
      color: annotations.color || 'default'
    },
    plain_text: String(text)
  }];
}

/**
 * Create a heading block
 */
function createHeading(text, level = 1) {
  const headingLevel = Math.min(Math.max(level, 1), 3);
  const headingType = `heading_${headingLevel}`;
  
  return {
    object: 'block',
    type: headingType,
    [headingType]: {
      rich_text: createRichText(text, { bold: true }),
      color: 'default'
    }
  };
}

/**
 * Create a paragraph block
 */
function createParagraph(text, annotations = {}) {
  return {
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: createRichText(text, annotations),
      color: 'default'
    }
  };
}

/**
 * Create a bulleted list item
 */
function createBulletedListItem(text, children = null) {
  const block = {
    object: 'block',
    type: 'bulleted_list_item',
    bulleted_list_item: {
      rich_text: createRichText(text),
      color: 'default'
    }
  };

  if (children && children.length > 0) {
    block.bulleted_list_item.children = children;
  }

  return block;
}

/**
 * Create a numbered list item
 */
function createNumberedListItem(text, children = null) {
  const block = {
    object: 'block',
    type: 'numbered_list_item',
    numbered_list_item: {
      rich_text: createRichText(text),
      color: 'default'
    }
  };

  if (children && children.length > 0) {
    block.numbered_list_item.children = children;
  }

  return block;
}

/**
 * Create a callout block
 */
function createCallout(text, emoji = '💡', color = 'default') {
  return {
    object: 'block',
    type: 'callout',
    callout: {
      rich_text: createRichText(text),
      icon: {
        type: 'emoji',
        emoji: emoji
      },
      color: color
    }
  };
}

/**
 * Create a code block
 */
function createCodeBlock(code, language = 'plain_text') {
  return {
    object: 'block',
    type: 'code',
    code: {
      rich_text: createRichText(code),
      language: language
    }
  };
}

/**
 * Create a divider block
 */
function createDivider() {
  return {
    object: 'block',
    type: 'divider',
    divider: {}
  };
}

/**
 * Create a toggle block (collapsible section)
 */
function createToggle(text, children = []) {
  return {
    object: 'block',
    type: 'toggle',
    toggle: {
      rich_text: createRichText(text, { bold: true }),
      color: 'default',
      children: children
    }
  };
}

/**
 * Process overview section
 */
function processOverview(overview) {
  const blocks = [];
  
  if (!overview) return blocks;

  blocks.push(createHeading('Overview', 2));

  if (overview.description) {
    blocks.push(createParagraph(overview.description));
  }

  if (overview.key_capabilities && Array.isArray(overview.key_capabilities)) {
    blocks.push(createHeading('Key Capabilities', 3));
    overview.key_capabilities.forEach(capability => {
      blocks.push(createBulletedListItem(capability));
    });
  }

  if (overview.technical_specifications) {
    blocks.push(createHeading('Technical Specifications', 3));
    const specs = overview.technical_specifications;
    
    Object.keys(specs).forEach(key => {
      const value = specs[key];
      const displayValue = typeof value === 'boolean' 
        ? (value ? 'Yes' : 'No') 
        : String(value);
      blocks.push(createBulletedListItem(`${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${displayValue}`));
    });
  }

  return blocks;
}

/**
 * Process getting started section
 */
function processGettingStarted(getStarted) {
  const blocks = [];
  
  if (!getStarted) return blocks;

  blocks.push(createHeading('Getting Started', 2));

  if (getStarted.prerequisites && Array.isArray(getStarted.prerequisites)) {
    blocks.push(createHeading('Prerequisites', 3));
    getStarted.prerequisites.forEach(prereq => {
      const title = prereq.id ? prereq.id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Requirement';
      blocks.push(createCallout(`${title}: ${prereq.description}`, '📋', 'blue_background'));
    });
  }

  if (getStarted.installation && Array.isArray(getStarted.installation)) {
    blocks.push(createHeading('Installation Steps', 3));
    getStarted.installation.forEach((step, index) => {
      blocks.push(createNumberedListItem(`${step}`));
    });
  }

  if (getStarted.first_run && Array.isArray(getStarted.first_run)) {
    blocks.push(createHeading('First Run Setup', 3));
    getStarted.first_run.forEach((step, index) => {
      blocks.push(createNumberedListItem(`${step}`));
    });
  }

  return blocks;
}

/**
 * Process how to use section
 */
function processHowToUse(howToUse) {
  const blocks = [];
  
  if (!howToUse) return blocks;

  blocks.push(createHeading('How to Use', 2));

  // Process measurement setup
  if (howToUse.measurement_setup && Array.isArray(howToUse.measurement_setup)) {
    blocks.push(createHeading('Measurement Setup', 3));
    howToUse.measurement_setup.forEach(setup => {
      const stepTitle = `Step ${setup.step}: ${setup.description}`;
      const children = [];
      
      if (setup.details && Array.isArray(setup.details)) {
        setup.details.forEach(detail => {
          children.push(createBulletedListItem(detail));
        });
      }
      
      blocks.push(createToggle(stepTitle, children));
    });
  }

  // Process other subsections
  const subsections = ['validation_process', 'reporting', 'dashboard_usage'];
  subsections.forEach(section => {
    if (howToUse[section] && Array.isArray(howToUse[section])) {
      const title = section.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      blocks.push(createHeading(title, 3));
      howToUse[section].forEach(item => {
        blocks.push(createBulletedListItem(item));
      });
    }
  });

  return blocks;
}

/**
 * Process troubleshooting section
 */
function processTroubleshooting(troubleshooting) {
  const blocks = [];
  
  if (!troubleshooting || !Array.isArray(troubleshooting)) return blocks;

  blocks.push(createHeading('Troubleshooting', 2));

  troubleshooting.forEach(issue => {
    // Issue title
    const issueTitle = issue.description || issue.id || 'Unknown Issue';
    blocks.push(createHeading(issueTitle, 3));

    // Symptoms
    if (issue.symptoms && Array.isArray(issue.symptoms)) {
      blocks.push(createCallout('Symptoms:', '⚠️', 'orange_background'));
      issue.symptoms.forEach(symptom => {
        blocks.push(createBulletedListItem(symptom));
      });
    }

    // Resolution steps
    if (issue.resolution && Array.isArray(issue.resolution)) {
      blocks.push(createCallout('Resolution:', '🔧', 'green_background'));
      issue.resolution.forEach((step, index) => {
        blocks.push(createNumberedListItem(step));
      });
    }

    blocks.push(createDivider());
  });

  return blocks;
}

/**
 * Process integration section
 */
function processIntegration(integration) {
  const blocks = [];
  
  if (!integration) return blocks;

  blocks.push(createHeading('Integration', 2));

  // ERP Export
  if (integration.erp_export) {
    blocks.push(createHeading('ERP Export', 3));
    
    if (integration.erp_export.description) {
      blocks.push(createParagraph(integration.erp_export.description));
    }

    if (integration.erp_export.endpoints && Array.isArray(integration.erp_export.endpoints)) {
      integration.erp_export.endpoints.forEach(endpoint => {
        const endpointInfo = `${endpoint.method} ${endpoint.url}`;
        blocks.push(createCodeBlock(endpointInfo, 'plain_text'));
        
        if (endpoint.payload) {
          blocks.push(createCodeBlock(JSON.stringify(endpoint.payload, null, 2), 'json'));
        }
      });
    }
  }

  // QMS Integration
  if (integration.qms_integration) {
    blocks.push(createHeading('QMS Integration', 3));
    
    if (integration.qms_integration.description) {
      blocks.push(createParagraph(integration.qms_integration.description));
    }

    if (integration.qms_integration.methods && Array.isArray(integration.qms_integration.methods)) {
      integration.qms_integration.methods.forEach(method => {
        blocks.push(createBulletedListItem(method));
      });
    }
  }

  // API Reference
  if (integration.api_reference) {
    blocks.push(createHeading('API Reference', 3));
    
    if (integration.api_reference.base_url) {
      blocks.push(createCallout(`Base URL: ${integration.api_reference.base_url}`, '🔗'));
    }

    if (integration.api_reference.endpoints && Array.isArray(integration.api_reference.endpoints)) {
      blocks.push(createParagraph('Available Endpoints:'));
      integration.api_reference.endpoints.forEach(endpoint => {
        blocks.push(createCodeBlock(endpoint, 'plain_text'));
      });
    }
  }

  return blocks;
}

/**
 * Process FAQ section
 */
function processFAQ(faq) {
  const blocks = [];
  
  if (!faq || !Array.isArray(faq)) return blocks;

  blocks.push(createHeading('Frequently Asked Questions', 2));

  faq.forEach((item, index) => {
    // Question as toggle, answer as content
    const questionText = `Q${index + 1}: ${item.question}`;
    const answerBlocks = [createParagraph(item.answer)];
    
    blocks.push(createToggle(questionText, answerBlocks));
  });

  return blocks;
}

/**
 * Main processing function
 */
function processDocument(document) {
  const blocks = [];

  try {
    // Document title
    if (document.product_name) {
      blocks.push(createHeading(document.product_name, 1));
      blocks.push(createDivider());
    }

    // Process each section
    const sections = [
      { key: 'overview', processor: processOverview },
      { key: 'get_started', processor: processGettingStarted },
      { key: 'how_to_use', processor: processHowToUse },
      { key: 'edge_cases_and_troubleshooting', processor: processTroubleshooting },
      { key: 'integration', processor: processIntegration },
      { key: 'faq', processor: processFAQ }
    ];

    sections.forEach(section => {
      if (document[section.key]) {
        const sectionBlocks = section.processor(document[section.key]);
        blocks.push(...sectionBlocks);
        
        // Add spacing between major sections
        if (sectionBlocks.length > 0) {
          blocks.push(createDivider());
        }
      }
    });

    // Handle any additional sections not explicitly processed
    Object.keys(document).forEach(key => {
      if (!['product_name', 'overview', 'get_started', 'how_to_use', 'edge_cases_and_troubleshooting', 'integration', 'faq'].includes(key)) {
        console.log(`Processing additional section: ${key}`);
        
        const sectionTitle = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        blocks.push(createHeading(sectionTitle, 2));
        
        const content = document[key];
        if (typeof content === 'string') {
          blocks.push(createParagraph(content));
        } else if (Array.isArray(content)) {
          content.forEach(item => {
            if (typeof item === 'string') {
              blocks.push(createBulletedListItem(item));
            } else if (typeof item === 'object') {
              blocks.push(createParagraph(JSON.stringify(item, null, 2)));
            }
          });
        } else if (typeof content === 'object') {
          blocks.push(createCodeBlock(JSON.stringify(content, null, 2), 'json'));
        }
        
        blocks.push(createDivider());
      }
    });

  } catch (error) {
    console.error('Error processing document section:', error.message);
    blocks.push(createCallout(`Error processing document: ${error.message}`, '❌', 'red_background'));
  }

  return blocks;
}

// Main execution
try {
  console.log('Starting documentation conversion...');
  
  const notionBlocks = processDocument(document);
  
  // Prepare final output
  const output = {
    success: true,
    children: notionBlocks,
    summary: {
      totalBlocks: notionBlocks.length,
      documentTitle: document.product_name || 'Technical Documentation',
      sectionsProcessed: Object.keys(document).length,
      processingTimestamp: new Date().toISOString(),
      documentType: 'technical_documentation'
    }
  };

  console.log(`Conversion complete! Generated ${notionBlocks.length} Notion blocks.`);
  console.log(`Document: ${output.summary.documentTitle}`);
  console.log(`Sections processed: ${output.summary.sectionsProcessed}`);

  return [{ json: output }];

} catch (error) {
  console.error('Error during conversion:', error.message);
  
  return [{
    json: {
      success: false,
      error: error.message,
      stack: error.stack,
      inputPreview: JSON.stringify(inputData).substring(0, 500) + '...'
    }
  }];
}