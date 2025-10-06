// Simplified N8N JSON Extractor - Direct Approach
// Focus on extracting the actual JSON content without complex processing

const items = $input.all();

// Helper function to extract content summary from landing page
function extractContentSummary(landingPage) {
  const summary = {
    texts: [],
    images: [],
    links: [],
    sections: [],
    blocks: []
  };
  
  if (landingPage.zones && Array.isArray(landingPage.zones)) {
    landingPage.zones.forEach(zone => {
      if (zone.sections && Array.isArray(zone.sections)) {
        zone.sections.forEach(section => {
          summary.sections.push({
            id: section.section_id,
            name: section.section_name,
            type: section.section_type,
            zone: zone.zone_name
          });
          
          if (section.blocks && Array.isArray(section.blocks)) {
            section.blocks.forEach(block => {
              summary.blocks.push({
                id: block.block_id,
                type: block.block_type,
                category: block.block_category,
                zone: zone.zone_name,
                section: section.section_name
              });
              
              if (block.content) {
                // Extract text content
                if (block.content.text) {
                  summary.texts.push({
                    text: block.content.text,
                    type: block.block_type,
                    block_id: block.block_id,
                    zone: zone.zone_name,
                    section: section.section_name
                  });
                }
                
                // Extract images
                if (block.content.media_url) {
                  summary.images.push({
                    url: block.content.media_url,
                    alt_text: block.content.alt_text || '',
                    type: block.content.media_type || 'image',
                    block_id: block.block_id,
                    zone: zone.zone_name,
                    section: section.section_name
                  });
                }
                
                // Extract links
                if (block.content.link_url) {
                  summary.links.push({
                    url: block.content.link_url,
                    text: block.content.text || '',
                    target: block.content.link_target || '_self',
                    block_id: block.block_id,
                    zone: zone.zone_name,
                    section: section.section_name
                  });
                }
                
                // Extract list items
                if (block.content.items && Array.isArray(block.content.items)) {
                  block.content.items.forEach(item => {
                    const itemText = typeof item === 'string' ? item : item.text;
                    if (itemText) {
                      summary.texts.push({
                        text: itemText,
                        type: 'list_item',
                        block_id: block.block_id,
                        zone: zone.zone_name,
                        section: section.section_name,
                        description: typeof item === 'object' ? item.description : ''
                      });
                    }
                  });
                }
              }
            });
          }
        });
      }
    });
  }
  
  return {
    ...summary,
    totals: {
      zones: landingPage.zones?.length || 0,
      sections: summary.sections.length,
      blocks: summary.blocks.length,
      texts: summary.texts.length,
      images: summary.images.length,
      links: summary.links.length
    }
  };
}

function simpleExtract(items) {
  const results = [];
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    try {
      // Get the text content
      let textContent = '';
      
      if (item.json && typeof item.json === 'object' && item.json.output) {
        textContent = item.json.output;
      } else if (item.json && typeof item.json === 'string') {
        textContent = item.json;
      } else if (item.output) {
        textContent = item.output;
      } else if (typeof item === 'string') {
        textContent = item;
      } else {
        // Look deeper in the structure
        const findJsonString = (obj) => {
          if (typeof obj === 'string' && obj.includes('```json')) {
            return obj;
          }
          if (typeof obj === 'object' && obj !== null) {
            for (const value of Object.values(obj)) {
              const found = findJsonString(value);
              if (found) return found;
            }
          }
          return null;
        };
        
        textContent = findJsonString(item) || '';
      }
      
      if (!textContent) {
        results.push({
          json: {
            success: false,
            error: 'No text content found',
            item_index: i,
            debug: {
              item_type: typeof item,
              item_keys: Object.keys(item || {}),
              sample: JSON.stringify(item).substring(0, 300)
            }
          }
        });
        continue;
      }
      
      // Find ALL potential JSON content
      // Look for the pattern: ```json followed by content followed by ```
      const jsonStart = textContent.indexOf('```json');
      if (jsonStart === -1) {
        results.push({
          json: {
            success: false,
            error: 'No ```json marker found',
            item_index: i,
            content_sample: textContent.substring(0, 200),
            content_length: textContent.length
          }
        });
        continue;
      }
      
      // Find the start of actual JSON content (after ```json and any whitespace)
      const contentStart = textContent.indexOf('\n', jsonStart) + 1;
      
      // Find the end marker
      const jsonEnd = textContent.indexOf('```', contentStart);
      if (jsonEnd === -1) {
        results.push({
          json: {
            success: false,
            error: 'No closing ``` marker found',
            item_index: i,
            content_sample: textContent.substring(jsonStart, jsonStart + 200),
            found_start: jsonStart
          }
        });
        continue;
      }
      
      // Extract the JSON string
      const jsonString = textContent.substring(contentStart, jsonEnd).trim();
      
      if (!jsonString) {
        results.push({
          json: {
            success: false,
            error: 'Empty JSON content',
            item_index: i,
            extraction_range: `${contentStart}-${jsonEnd}`,
            content_around: textContent.substring(Math.max(0, jsonStart - 50), jsonEnd + 50)
          }
        });
        continue;
      }
      
      // Try to parse the JSON
      let parsedData;
      try {
        parsedData = JSON.parse(jsonString);
      } catch (parseError) {
        // Try to fix common issues
        let fixedJson = jsonString;
        
        // Remove any trailing incomplete content after the last complete object/array
        const openBraces = (fixedJson.match(/\{/g) || []).length;
        const closeBraces = (fixedJson.match(/\}/g) || []).length;
        
        if (openBraces > closeBraces) {
          // Add missing closing braces
          for (let j = 0; j < openBraces - closeBraces; j++) {
            fixedJson += '}';
          }
        }
        
        // Try parsing the fixed version
        try {
          parsedData = JSON.parse(fixedJson);
        } catch (fixError) {
          results.push({
            json: {
              success: false,
              error: 'JSON parsing failed',
              item_index: i,
              parse_error: parseError.message,
              fix_error: fixError.message,
              json_sample: jsonString.substring(0, 300),
              json_length: jsonString.length
            }
          });
          continue;
        }
      }
      
      // Successfully parsed JSON - return the actual data structure
      if (parsedData && parsedData.landing_page) {
        // If it's a landing page, extract and structure the data
        const landingPage = parsedData.landing_page;
        
        results.push({
          json: {
            success: true,
            item_index: i,
            page_title: landingPage.metadata?.page_title || 'Untitled',
            page_type: landingPage.metadata?.page_type || 'unknown',
            zones_count: landingPage.zones?.length || 0,
            
            // The full parsed landing page data
            landing_page: landingPage,
            
            // Flattened data for easy access
            zones: landingPage.zones || [],
            
            // Extract key content types
            content_summary: extractContentSummary(landingPage),
            
            extraction_info: {
              json_length: jsonString.length,
              content_length: textContent.length,
              extraction_range: `${contentStart}-${jsonEnd}`,
              parsed_successfully: true
            }
          }
        });
      } else {
        // If it's not a landing page structure, return raw parsed data
        results.push({
          json: {
            success: true,
            item_index: i,
            data_type: 'raw_json',
            raw_data: parsedData,
            extraction_info: {
              json_length: jsonString.length,
              content_length: textContent.length,
              extraction_range: `${contentStart}-${jsonEnd}`,
              has_landing_page: false
            }
          }
        });
      }
      
    } catch (error) {
      results.push({
        json: {
          success: false,
          error: error.message,
          item_index: i,
          error_type: error.name,
          stack: error.stack
        }
      });
    }
  }
  
  return results;
}

// Execute and return results
return simpleExtract(items);