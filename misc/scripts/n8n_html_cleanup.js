// N8N JavaScript Code to Clean HTML from Raw Response
// This code extracts clean HTML content from raw response files

// Get the input data
const inputData = $input.all();

// Function to clean HTML from raw response format
function cleanHtmlFromRaw(rawContent) {
  try {
    // Handle string input
    let content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);
    
    // Remove the "html\n" prefix if present
    if (content.startsWith('html\\n') || content.startsWith('html\n')) {
      content = content.replace(/^html\\n|^html\n/, '');
    }
    
    // Remove any leading/trailing whitespace and newlines
    content = content.trim();
    
    // If content starts with escaped characters, unescape them
    if (content.includes('\\n')) {
      content = content.replace(/\\n/g, '\n');
    }
    if (content.includes('\\t')) {
      content = content.replace(/\\t/g, '\t');
    }
    if (content.includes('\\"')) {
      content = content.replace(/\\"/g, '"');
    }
    
    // Ensure we have proper HTML structure
    if (!content.includes('<!DOCTYPE html>') && !content.includes('<html')) {
      throw new Error('No valid HTML structure found in content');
    }
    
    // Basic HTML validation - check for opening and closing html tags
    const hasOpeningHtml = content.includes('<html') || content.includes('<HTML');
    const hasClosingHtml = content.includes('</html>') || content.includes('</HTML>');
    
    if (!hasOpeningHtml || !hasClosingHtml) {
      console.warn('Warning: HTML structure may be incomplete');
    }
    
    return {
      success: true,
      cleanedHtml: content,
      originalLength: rawContent.length,
      cleanedLength: content.length,
      hasDoctype: content.includes('<!DOCTYPE'),
      hasHtmlTags: hasOpeningHtml && hasClosingHtml
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      originalContent: rawContent
    };
  }
}

// Function to extract metadata from HTML
function extractHtmlMetadata(htmlContent) {
  const metadata = {
    title: '',
    description: '',
    viewport: '',
    charset: '',
    sectionsFound: [],
    mediaFiles: []
  };
  
  try {
    // Extract title
    const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      metadata.title = titleMatch[1].trim();
    }
    
    // Extract meta description
    const descMatch = htmlContent.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    if (descMatch) {
      metadata.description = descMatch[1].trim();
    }
    
    // Extract viewport
    const viewportMatch = htmlContent.match(/<meta[^>]*name=["']viewport["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    if (viewportMatch) {
      metadata.viewport = viewportMatch[1].trim();
    }
    
    // Extract charset
    const charsetMatch = htmlContent.match(/<meta[^>]*charset=["']?([^"'\s>]+)["']?[^>]*>/i);
    if (charsetMatch) {
      metadata.charset = charsetMatch[1].trim();
    }
    
    // Find sections with IDs
    const sectionMatches = htmlContent.match(/<(?:section|header|footer|div)[^>]*id=["']([^"']+)["'][^>]*>/gi);
    if (sectionMatches) {
      metadata.sectionsFound = sectionMatches.map(match => {
        const idMatch = match.match(/id=["']([^"']+)["']/i);
        return idMatch ? idMatch[1] : '';
      }).filter(id => id);
    }
    
    // Find media files (images, videos, etc.)
    const mediaMatches = htmlContent.match(/(?:src|href)=["']([^"']+\.(?:mp4|jpg|png|gif|svg|webp|pdf))["']/gi);
    if (mediaMatches) {
      metadata.mediaFiles = mediaMatches.map(match => {
        const urlMatch = match.match(/["']([^"']+)["']/);
        return urlMatch ? urlMatch[1] : '';
      }).filter(url => url);
    }
    
  } catch (error) {
    console.warn('Error extracting metadata:', error.message);
  }
  
  return metadata;
}

// Process each input item
const results = inputData.map((item, index) => {
  // Get the raw content - could be in different properties
  let rawContent = item.json.content || item.json.output || item.json.data || item.json;
  
  // If it's still an object, try to find HTML content
  if (typeof rawContent === 'object') {
    // Look for common property names that might contain HTML
    const possibleProps = ['html', 'body', 'content', 'data', 'output', 'response'];
    for (const prop of possibleProps) {
      if (rawContent[prop] && typeof rawContent[prop] === 'string') {
        rawContent = rawContent[prop];
        break;
      }
    }
  }
  
  // Clean the HTML content
  const cleanResult = cleanHtmlFromRaw(rawContent);
  
  if (cleanResult.success) {
    // Extract metadata from cleaned HTML
    const metadata = extractHtmlMetadata(cleanResult.cleanedHtml);
    
    return {
      json: {
        index: index,
        success: true,
        cleanedHtml: cleanResult.cleanedHtml,
        metadata: metadata,
        stats: {
          originalLength: cleanResult.originalLength,
          cleanedLength: cleanResult.cleanedLength,
          compressionRatio: ((cleanResult.originalLength - cleanResult.cleanedLength) / cleanResult.originalLength * 100).toFixed(2) + '%',
          hasDoctype: cleanResult.hasDoctype,
          hasHtmlTags: cleanResult.hasHtmlTags
        },
        processingDate: new Date().toISOString()
      }
    };
  } else {
    return {
      json: {
        index: index,
        success: false,
        error: cleanResult.error,
        originalContent: cleanResult.originalContent,
        processingDate: new Date().toISOString()
      }
    };
  }
});

// Return the processed results
return results;