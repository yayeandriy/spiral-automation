// n8n Code to Extract Notion Blocks from Response Array

// Get the input data
const input = $input.all()[0].json;

// The data comes as an array with objects containing "output" field
let responseData = input;

// If input is already the array structure we expect
if (Array.isArray(input) && input[0] && input[0].output) {
  responseData = input[0].output;
} else if (input.output) {
  responseData = input.output;
} else if (typeof input === 'string') {
  responseData = input;
}

// Extract Notion blocks from the text
function extractNotionBlocks(text) {
  if (!text || typeof text !== 'string') {
    return { children: [] };
  }
  
  // Look for the JSON code block pattern ```json ... ```
  const jsonCodeBlockPattern = /```json\s*\n([\s\S]*?)\n```/;
  const match = text.match(jsonCodeBlockPattern);
  
  if (match && match[1]) {
    try {
      const jsonContent = match[1].trim();
      const parsed = JSON.parse(jsonContent);
      
      if (parsed.children && Array.isArray(parsed.children)) {
        return parsed;
      }
    } catch (e) {
      // If JSON is malformed, try to fix common issues
      let jsonContent = match[1].trim();
      
      // If JSON is cut off, try to complete it
      if (!jsonContent.endsWith('}')) {
        // Count open braces vs close braces
        const openBraces = (jsonContent.match(/\{/g) || []).length;
        const closeBraces = (jsonContent.match(/\}/g) || []).length;
        const openBrackets = (jsonContent.match(/\[/g) || []).length;
        const closeBrackets = (jsonContent.match(/\]/g) || []).length;
        
        // Add missing closing brackets and braces
        for (let i = 0; i < (openBrackets - closeBrackets); i++) {
          jsonContent += ']';
        }
        for (let i = 0; i < (openBraces - closeBraces); i++) {
          jsonContent += '}';
        }
        
        try {
          const parsed = JSON.parse(jsonContent);
          if (parsed.children && Array.isArray(parsed.children)) {
            return parsed;
          }
        } catch (e2) {
          // Still failed, return empty
        }
      }
    }
  }
  
  // Fallback: look for children array directly
  const childrenPattern = /"children":\s*\[([\s\S]*)/;
  const childrenMatch = text.match(childrenPattern);
  
  if (childrenMatch) {
    try {
      // Try to extract just the children array
      let childrenContent = '[' + childrenMatch[1];
      
      // Basic bracket balancing
      const openBrackets = (childrenContent.match(/\[/g) || []).length;
      const closeBrackets = (childrenContent.match(/\]/g) || []).length;
      
      for (let i = 0; i < (openBrackets - closeBrackets); i++) {
        childrenContent += ']';
      }
      
      const children = JSON.parse(childrenContent);
      if (Array.isArray(children)) {
        return { children: children };
      }
    } catch (e) {
      // Final fallback
    }
  }
  
  return { children: [] };
}

return extractNotionBlocks(responseData);