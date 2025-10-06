// n8n JavaScript Code for extracting JSON from response text
// This script extracts JSON from markdown code blocks or plain text responses

// Get input data - adjust the property name based on your n8n workflow
const inputText = $input.all()[0].json.response || $input.all()[0].json.text || $input.all()[0].json.content;

console.log('Input text length:', inputText ? inputText.length : 0);

if (!inputText) {
  throw new Error('No input text found. Check your input property name.');
}

/**
 * Extract JSON from various text formats
 * Handles: markdown code blocks, plain JSON, quoted JSON
 */
function extractJSON(text) {
  console.log('Starting JSON extraction...');
  
  // Method 1: Extract from markdown code blocks (```json ... ```)
  const markdownJsonRegex = /```json\s*([\s\S]*?)\s*```/gi;
  let match = markdownJsonRegex.exec(text);
  
  if (match && match[1]) {
    console.log('Found JSON in markdown code block');
    try {
      const cleanJson = match[1].trim();
      const parsed = JSON.parse(cleanJson);
      return {
        success: true,
        json: parsed,
        rawJson: cleanJson,
        extractionMethod: 'markdown_codeblock'
      };
    } catch (e) {
      console.log('Failed to parse JSON from markdown:', e.message);
    }
  }

  // Method 2: Extract from code blocks without language specification (``` ... ```)
  const codeBlockRegex = /```\s*([\s\S]*?)\s*```/gi;
  match = codeBlockRegex.exec(text);
  
  if (match && match[1]) {
    console.log('Found content in generic code block');
    try {
      const cleanJson = match[1].trim();
      // Check if it starts with { or [ (likely JSON)
      if (cleanJson.startsWith('{') || cleanJson.startsWith('[')) {
        const parsed = JSON.parse(cleanJson);
        return {
          success: true,
          json: parsed,
          rawJson: cleanJson,
          extractionMethod: 'generic_codeblock'
        };
      }
    } catch (e) {
      console.log('Failed to parse JSON from generic code block:', e.message);
    }
  }

  // Method 3: Look for JSON-like structures in the text
  const jsonStartRegex = /({[\s\S]*})/;
  match = jsonStartRegex.exec(text);
  
  if (match && match[1]) {
    console.log('Found JSON-like structure in text');
    try {
      const cleanJson = match[1].trim();
      const parsed = JSON.parse(cleanJson);
      return {
        success: true,
        json: parsed,
        rawJson: cleanJson,
        extractionMethod: 'json_structure'
      };
    } catch (e) {
      console.log('Failed to parse JSON structure:', e.message);
    }
  }

  // Method 4: Try to parse the entire text as JSON
  try {
    console.log('Attempting to parse entire text as JSON');
    const parsed = JSON.parse(text.trim());
    return {
      success: true,
      json: parsed,
      rawJson: text.trim(),
      extractionMethod: 'direct_parse'
    };
  } catch (e) {
    console.log('Failed to parse entire text as JSON:', e.message);
  }

  // Method 5: Look for escaped JSON (with \n characters)
  const unescapedText = text.replace(/\\n/g, '\n').replace(/\\"/g, '"');
  try {
    console.log('Attempting to parse unescaped text as JSON');
    const parsed = JSON.parse(unescapedText.trim());
    return {
      success: true,
      json: parsed,
      rawJson: unescapedText.trim(),
      extractionMethod: 'unescaped_parse'
    };
  } catch (e) {
    console.log('Failed to parse unescaped text:', e.message);
  }

  return {
    success: false,
    error: 'No valid JSON found in the provided text',
    extractionMethod: 'none'
  };
}

/**
 * Validate extracted JSON structure
 */
function validateDocumentStructure(jsonObj) {
  console.log('Validating document structure...');
  
  const validationResults = {
    isValid: true,
    warnings: [],
    errors: []
  };

  // Check for document root
  if (!jsonObj.document) {
    validationResults.errors.push('Missing "document" root object');
    validationResults.isValid = false;
  } else {
    // Check metadata
    if (!jsonObj.document.metadata) {
      validationResults.warnings.push('Missing "metadata" object');
    } else if (!jsonObj.document.metadata.title) {
      validationResults.warnings.push('Missing document title');
    }

    // Check sections
    if (!jsonObj.document.sections || !Array.isArray(jsonObj.document.sections)) {
      validationResults.errors.push('Missing or invalid "sections" array');
      validationResults.isValid = false;
    } else if (jsonObj.document.sections.length === 0) {
      validationResults.warnings.push('Document has no sections');
    }
  }

  return validationResults;
}

/**
 * Extract metadata from the document
 */
function extractMetadata(jsonObj) {
  if (!jsonObj.document || !jsonObj.document.metadata) {
    return null;
  }

  const metadata = jsonObj.document.metadata;
  return {
    title: metadata.title || 'Untitled Document',
    version: metadata.version || 'Unknown',
    lastUpdated: metadata.lastUpdated || null,
    language: metadata.language || 'en',
    tags: metadata.tags || [],
    tagCount: (metadata.tags || []).length
  };
}

/**
 * Count content elements
 */
function analyzeContent(jsonObj) {
  if (!jsonObj.document || !jsonObj.document.sections) {
    return null;
  }

  const analysis = {
    totalSections: jsonObj.document.sections.length,
    contentSections: 0,
    figureSections: 0,
    totalSubsections: 0,
    totalContentBlocks: 0,
    contentTypes: {}
  };

  function countInSection(section) {
    // Count section types
    if (section.type === 'content') analysis.contentSections++;
    if (section.type === 'figure') analysis.figureSections++;

    // Count content blocks
    if (section.content && Array.isArray(section.content)) {
      analysis.totalContentBlocks += section.content.length;
      
      section.content.forEach(block => {
        const type = block.type || 'unknown';
        analysis.contentTypes[type] = (analysis.contentTypes[type] || 0) + 1;
      });
    }

    // Count subsections recursively
    if (section.subsections && Array.isArray(section.subsections)) {
      analysis.totalSubsections += section.subsections.length;
      section.subsections.forEach(countInSection);
    }
  }

  jsonObj.document.sections.forEach(countInSection);

  return analysis;
}

// Main execution
try {
  console.log('Starting JSON extraction process...');
  
  const extractionResult = extractJSON(inputText);
  
  if (!extractionResult.success) {
    return [{
      json: {
        success: false,
        error: extractionResult.error,
        extractionMethod: extractionResult.extractionMethod,
        inputPreview: inputText.substring(0, 200) + '...'
      }
    }];
  }

  console.log('JSON extracted successfully using method:', extractionResult.extractionMethod);

  // Validate the structure
  const validation = validateDocumentStructure(extractionResult.json);
  console.log('Validation complete:', validation.isValid ? 'PASSED' : 'FAILED');

  // Extract metadata and analyze content
  const metadata = extractMetadata(extractionResult.json);
  const contentAnalysis = analyzeContent(extractionResult.json);

  // Prepare output
  const output = {
    success: true,
    extractionMethod: extractionResult.extractionMethod,
    
    // The extracted JSON document
    document: extractionResult.json,
    
    // Metadata summary
    metadata: metadata,
    
    // Content analysis
    contentAnalysis: contentAnalysis,
    
    // Validation results
    validation: validation,
    
    // Raw JSON string (useful for debugging or re-processing)
    rawJsonString: extractionResult.rawJson,
    
    // Processing info
    processingInfo: {
      inputTextLength: inputText.length,
      extractedJsonLength: extractionResult.rawJson.length,
      processedAt: new Date().toISOString(),
      compressionRatio: Math.round((extractionResult.rawJson.length / inputText.length) * 100)
    }
  };

  console.log('Processing complete. Document title:', metadata?.title || 'Unknown');
  console.log('Total sections:', contentAnalysis?.totalSections || 0);
  console.log('Validation status:', validation.isValid ? 'Valid' : 'Invalid');

  return [{ json: output }];

} catch (error) {
  console.error('Error during processing:', error.message);
  
  return [{
    json: {
      success: false,
      error: error.message,
      stack: error.stack,
      inputPreview: inputText ? inputText.substring(0, 200) + '...' : 'No input'
    }
  }];
}