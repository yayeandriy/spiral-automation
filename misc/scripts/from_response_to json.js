// n8n JavaScript Code for extracting JSON from response text
// This script extracts JSON from markdown code blocks or plain text responses

// Get input data - adjust the property name based on your n8n workflow
const inputText = $input.all()[0].json.output;

console.log('Input text length:', inputText ? inputText.length : 0);

if (!inputText) {
  throw new Error('No input text found. Check your input property name.');
}

/**
 * Clean and fix common JSON syntax issues
 */
function cleanJSON(text) {
  let cleaned = text;
  
  // Remove BOM and invisible characters
  cleaned = cleaned.replace(/^\uFEFF/, '');
  
  // Fix common JSON issues
  cleaned = cleaned
    // Remove trailing commas before closing braces/brackets
    .replace(/,(\s*[}\]])/g, '$1')
    // Fix unescaped quotes in strings (basic attempt)
    .replace(/([^\\])"([^",:}\]]*)"([^,:}\]\s])/g, '$1\\"$2\\"$3')
    // Remove comments (basic /* */ and //)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    // Fix missing quotes on property names (basic cases)
    .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
  
  return cleaned;
}

/**
 * Extract JSON from various text formats
 * Handles: markdown code blocks, plain JSON, quoted JSON
 */
function extractJSON(text) {
  console.log('Starting JSON extraction...');
  console.log('Input preview:', text.substring(0, 200) + '...');
  
  const methods = [
    {
      name: 'markdown_codeblock',
      regex: /```json\s*([\s\S]*?)\s*```/gi,
      description: 'JSON in markdown code block'
    },
    {
      name: 'generic_codeblock', 
      regex: /```\s*([\s\S]*?)\s*```/gi,
      description: 'Generic code block',
      validate: (content) => content.trim().startsWith('{') || content.trim().startsWith('[')
    },
    {
      name: 'json_structure',
      regex: /({[\s\S]*})/,
      description: 'JSON-like structure in text'
    },
    {
      name: 'array_structure',
      regex: /(\[[\s\S]*\])/,
      description: 'Array structure in text'
    }
  ];

  // Try extraction methods
  for (const method of methods) {
    console.log(`Trying method: ${method.description}`);
    const match = method.regex.exec(text);
    
    if (match && match[1]) {
      const rawContent = match[1].trim();
      
      // Skip if validation fails
      if (method.validate && !method.validate(rawContent)) {
        console.log(`Validation failed for ${method.name}`);
        continue;
      }
      
      console.log(`Found content with ${method.name}, length: ${rawContent.length}`);
      console.log(`Content preview: ${rawContent.substring(0, 100)}...`);
      
      // Try parsing with progressive cleaning
      const attempts = [
        { content: rawContent, description: 'raw' },
        { content: cleanJSON(rawContent), description: 'cleaned' },
        { content: rawContent.replace(/\n/g, ' '), description: 'newlines removed' },
        { content: rawContent.replace(/[\u0000-\u001F\u007F-\u009F]/g, ''), description: 'control chars removed' }
      ];
      
      for (const attempt of attempts) {
        try {
          console.log(`Parsing attempt: ${attempt.description}`);
          const parsed = JSON.parse(attempt.content);
          
          return {
            success: true,
            json: parsed,
            rawJson: attempt.content,
            extractionMethod: `${method.name}_${attempt.description}`,
            originalLength: text.length,
            extractedLength: attempt.content.length
          };
        } catch (e) {
          console.log(`Parse failed (${attempt.description}):`, e.message.substring(0, 100));
        }
      }
    }
  }

  // Method: Try parsing entire text
  console.log('Attempting to parse entire text as JSON');
  const wholeTextAttempts = [
    { content: text.trim(), description: 'whole_text' },
    { content: cleanJSON(text), description: 'whole_text_cleaned' },
    { content: text.replace(/^[^{\[]*/, '').replace(/[^}\]]*$/, ''), description: 'trimmed_boundaries' }
  ];

  for (const attempt of wholeTextAttempts) {
    try {
      const parsed = JSON.parse(attempt.content);
      return {
        success: true,
        json: parsed,
        rawJson: attempt.content,
        extractionMethod: attempt.description,
        originalLength: text.length,
        extractedLength: attempt.content.length
      };
    } catch (e) {
      console.log(`Direct parse failed (${attempt.description}):`, e.message.substring(0, 100));
    }
  }

  // Last resort: try to find valid JSON fragments
  console.log('Attempting fragment extraction...');
  const braceMatches = text.matchAll(/{[^{}]*}/g);
  for (const match of braceMatches) {
    try {
      const parsed = JSON.parse(match[0]);
      return {
        success: true,
        json: parsed,
        rawJson: match[0],
        extractionMethod: 'fragment_extraction',
        originalLength: text.length,
        extractedLength: match[0].length
      };
    } catch (e) {
      // Continue to next fragment
    }
  }

  return {
    success: false,
    error: 'No valid JSON found in the provided text',
    extractionMethod: 'none',
    attempts: methods.length + wholeTextAttempts.length,
    inputLength: text.length,
    inputPreview: text.substring(0, 500)
  };
}

/**
 * Validate extracted JSON structure (generic validation)
 */
function validateDocumentStructure(jsonObj) {
  console.log('Validating document structure...');
  
  const validationResults = {
    isValid: true,
    warnings: [],
    errors: []
  };

  // Basic JSON validation
  if (!jsonObj || typeof jsonObj !== 'object') {
    validationResults.errors.push('Invalid JSON object');
    validationResults.isValid = false;
    return validationResults;
  }

  // Check if it's an array or object
  if (Array.isArray(jsonObj)) {
    validationResults.warnings.push('Document is an array format');
  } else {
    validationResults.warnings.push('Document is an object format');
  }

  // Count top-level properties
  const topLevelKeys = Object.keys(jsonObj);
  if (topLevelKeys.length === 0) {
    validationResults.warnings.push('Document has no properties');
  } else {
    console.log('Top-level properties:', topLevelKeys.join(', '));
  }

  return validationResults;
}

/**
 * Extract metadata from the document (generic approach)
 */
function extractMetadata(jsonObj) {
  // Try different possible metadata locations
  let metadata = null;
  
  if (jsonObj.document && jsonObj.document.metadata) {
    metadata = jsonObj.document.metadata;
  } else if (jsonObj.metadata) {
    metadata = jsonObj.metadata;
  } else if (jsonObj.product_name) {
    // Handle technical documentation format
    metadata = {
      title: jsonObj.product_name,
      type: 'technical_documentation'
    };
  }
  
  if (!metadata) {
    // Try to extract basic info from the structure
    const keys = Object.keys(jsonObj);
    return {
      title: jsonObj.title || jsonObj.name || jsonObj.product_name || 'Extracted Document',
      version: jsonObj.version || 'Unknown',
      lastUpdated: null,
      language: 'en',
      tags: keys.slice(0, 5), // Use first 5 keys as tags
      tagCount: keys.length,
      structure: keys
    };
  }

  return {
    title: metadata.title || metadata.name || 'Untitled Document',
    version: metadata.version || 'Unknown',
    lastUpdated: metadata.lastUpdated || null,
    language: metadata.language || 'en',
    tags: metadata.tags || [],
    tagCount: (metadata.tags || []).length
  };
}

/**
 * Count content elements (generic analysis)
 */
function analyzeContent(jsonObj) {
  const analysis = {
    totalProperties: 0,
    objectProperties: 0,
    arrayProperties: 0,
    stringProperties: 0,
    numberProperties: 0,
    booleanProperties: 0,
    propertyTypes: {},
    maxDepth: 0
  };

  function analyzeObject(obj, depth = 0) {
    if (depth > analysis.maxDepth) {
      analysis.maxDepth = depth;
    }

    if (typeof obj === 'object' && obj !== null) {
      if (Array.isArray(obj)) {
        analysis.arrayProperties++;
        analysis.propertyTypes['array'] = (analysis.propertyTypes['array'] || 0) + 1;
        obj.forEach(item => analyzeObject(item, depth + 1));
      } else {
        analysis.objectProperties++;
        analysis.propertyTypes['object'] = (analysis.propertyTypes['object'] || 0) + 1;
        Object.keys(obj).forEach(key => {
          analysis.totalProperties++;
          analyzeObject(obj[key], depth + 1);
        });
      }
    } else {
      const type = typeof obj;
      switch (type) {
        case 'string':
          analysis.stringProperties++;
          break;
        case 'number':
          analysis.numberProperties++;
          break;
        case 'boolean':
          analysis.booleanProperties++;
          break;
      }
      analysis.propertyTypes[type] = (analysis.propertyTypes[type] || 0) + 1;
    }
  }

  analyzeObject(jsonObj);

  // Add specific analysis for common document structures
  const topLevelKeys = Object.keys(jsonObj);
  analysis.topLevelSections = topLevelKeys.length;
  analysis.documentType = 'unknown';

  // Detect document type
  if (jsonObj.product_name && jsonObj.overview) {
    analysis.documentType = 'technical_documentation';
  } else if (jsonObj.document && jsonObj.document.metadata) {
    analysis.documentType = 'structured_document';
  } else if (Array.isArray(jsonObj) && jsonObj[0] && jsonObj[0].document) {
    analysis.documentType = 'response_array';
  }

  return analysis;
}

// Main execution
try {
  console.log('Starting JSON extraction process...');
  
  const extractionResult = extractJSON(inputText);
  
  if (!extractionResult.success) {
    console.error('All extraction methods failed');
    console.error('Input length:', extractionResult.inputLength);
    console.error('Methods tried:', extractionResult.attempts);
    
    return [{
      json: {
        success: false,
        error: extractionResult.error,
        extractionMethod: extractionResult.extractionMethod,
        attempts: extractionResult.attempts,
        inputLength: extractionResult.inputLength,
        inputPreview: extractionResult.inputPreview,
        debugInfo: {
          firstChar: inputText.charAt(0),
          lastChar: inputText.charAt(inputText.length - 1),
          hasCodeBlocks: inputText.includes('```'),
          hasBraces: inputText.includes('{'),
          hasBrackets: inputText.includes('[')
        }
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
  console.log('Document type:', contentAnalysis?.documentType || 'Unknown');
  console.log('Top-level sections:', contentAnalysis?.topLevelSections || 0);
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