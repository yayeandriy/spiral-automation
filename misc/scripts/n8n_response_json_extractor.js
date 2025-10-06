// N8N JavaScript Code to Extract JSON from Response Output
// This code handles the extraction of embedded JSON from response strings

// Main extraction function
function extractJsonFromResponse(inputData) {
  try {
    // Check if input is an array and get the first item
    const responseItem = Array.isArray(inputData) ? inputData[0] : inputData;
    
    // Extract the output field with multiple fallback options
    let outputText;
    
    if (responseItem && responseItem.output) {
      outputText = responseItem.output;
    } else if (responseItem && typeof responseItem === 'string') {
      outputText = responseItem;
    } else if (responseItem && responseItem.json && typeof responseItem.json === 'string') {
      outputText = responseItem.json;
    } else if (responseItem) {
      // Try to find any string field that contains JSON
      const stringFields = Object.values(responseItem).filter(value => typeof value === 'string');
      const jsonField = stringFields.find(field => field.includes('```json'));
      if (jsonField) {
        outputText = jsonField;
      } else {
        throw new Error(`No output field found in response. Available fields: ${Object.keys(responseItem).join(', ')}`);
      }
    } else {
      throw new Error('No valid response item found');
    }
    
    // Find JSON content between ```json and ``` markers
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const jsonMatch = outputText.match(jsonRegex);
    
    if (!jsonMatch || !jsonMatch[1]) {
      throw new Error('No JSON found between ```json``` markers');
    }
    
    // Parse the extracted JSON
    const extractedJson = JSON.parse(jsonMatch[1]);
    
    return {
      success: true,
      data: extractedJson,
      metadata: {
        extraction_timestamp: new Date().toISOString(),
        original_text_length: outputText.length,
        extracted_json_length: jsonMatch[1].length
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: null,
      metadata: {
        extraction_timestamp: new Date().toISOString(),
        error_type: error.name
      }
    };
  }
}

// Alternative function to extract specific parts of the landing page structure
function extractLandingPageComponents(inputData) {
  try {
    const extractionResult = extractJsonFromResponse(inputData);
    
    if (!extractionResult.success) {
      return extractionResult;
    }
    
    const landingPage = extractionResult.data.landing_page;
    
    if (!landingPage) {
      throw new Error('No landing_page found in extracted JSON');
    }
    
    // Extract key components
    const components = {
      metadata: landingPage.metadata || {},
      zones: [],
      sections: [],
      blocks: [],
      images: [],
      links: [],
      statistics: {
        total_zones: 0,
        total_sections: 0,
        total_blocks: 0,
        zone_types: [],
        section_types: [],
        block_types: []
      }
    };
    
    // Process zones and their nested content
    if (landingPage.zones && Array.isArray(landingPage.zones)) {
      landingPage.zones.forEach(zone => {
        // Add zone to collection
        components.zones.push({
          zone_id: zone.zone_id,
          zone_type: zone.zone_type,
          zone_name: zone.zone_name,
          zone_purpose: zone.zone_purpose,
          position: zone.position,
          is_above_fold: zone.is_above_fold
        });
        
        // Track zone types
        if (zone.zone_type && !components.statistics.zone_types.includes(zone.zone_type)) {
          components.statistics.zone_types.push(zone.zone_type);
        }
        
        // Process sections within zone
        if (zone.sections && Array.isArray(zone.sections)) {
          zone.sections.forEach(section => {
            components.sections.push({
              section_id: section.section_id,
              section_type: section.section_type,
              section_name: section.section_name,
              section_purpose: section.section_purpose,
              parent_zone_id: zone.zone_id,
              layout: section.layout
            });
            
            // Track section types
            if (section.section_type && !components.statistics.section_types.includes(section.section_type)) {
              components.statistics.section_types.push(section.section_type);
            }
            
            // Process blocks within section
            if (section.blocks && Array.isArray(section.blocks)) {
              section.blocks.forEach(block => {
                const blockData = {
                  block_id: block.block_id,
                  block_category: block.block_category,
                  block_type: block.block_type,
                  parent_section_id: section.section_id,
                  parent_zone_id: zone.zone_id,
                  content: block.content || {}
                };
                
                components.blocks.push(blockData);
                
                // Track block types
                if (block.block_type && !components.statistics.block_types.includes(block.block_type)) {
                  components.statistics.block_types.push(block.block_type);
                }
                
                // Extract images
                if (block.content && block.content.media_url) {
                  components.images.push({
                    url: block.content.media_url,
                    type: block.content.media_type || 'unknown',
                    alt_text: block.content.alt_text || '',
                    source_block_id: block.block_id,
                    source_section_id: section.section_id,
                    source_zone_id: zone.zone_id
                  });
                }
                
                // Extract links
                if (block.content && block.content.link_url) {
                  components.links.push({
                    url: block.content.link_url,
                    text: block.content.text || '',
                    target: block.content.link_target || '_self',
                    source_block_id: block.block_id,
                    source_section_id: section.section_id,
                    source_zone_id: zone.zone_id
                  });
                }
              });
            }
          });
        }
      });
    }
    
    // Update statistics
    components.statistics.total_zones = components.zones.length;
    components.statistics.total_sections = components.sections.length;
    components.statistics.total_blocks = components.blocks.length;
    
    return {
      success: true,
      data: components,
      metadata: {
        extraction_timestamp: new Date().toISOString(),
        processing_summary: {
          zones_processed: components.zones.length,
          sections_processed: components.sections.length,
          blocks_processed: components.blocks.length,
          images_found: components.images.length,
          links_found: components.links.length
        }
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: null,
      metadata: {
        extraction_timestamp: new Date().toISOString(),
        error_type: error.name
      }
    };
  }
}

// Function to convert to content-focused structure (matching the new schema)
function convertToContentStructure(inputData) {
  try {
    const extractionResult = extractJsonFromResponse(inputData);
    
    if (!extractionResult.success) {
      return extractionResult;
    }
    
    const originalData = extractionResult.data.landing_page;
    
    // Convert to content-focused structure
    const contentStructure = {
      landing_content: {
        metadata: {
          page_title: originalData.metadata?.page_title || '',
          page_type: originalData.metadata?.page_type || 'consumer_hardware',
          target_audience: originalData.metadata?.target_audience || 'b2b',
          conversion_strategy: originalData.metadata?.conversion_strategy || 'demo_request',
          content_language: 'en',
          created_date: new Date().toISOString(),
          version: '1.0'
        },
        zones: []
      }
    };
    
    // Convert zones, removing styling and focusing on content
    if (originalData.zones && Array.isArray(originalData.zones)) {
      contentStructure.landing_content.zones = originalData.zones.map(zone => {
        const contentZone = {
          zone_id: zone.zone_id,
          zone_type: zone.zone_type,
          zone_name: zone.zone_name,
          zone_purpose: zone.zone_purpose,
          position: zone.position,
          is_above_fold: zone.is_above_fold,
          priority: zone.viewport_priority === 'critical' ? 'critical' : 
                   zone.viewport_priority === 'important' ? 'high' : 'medium',
          content_strategy: getContentStrategy(zone.zone_type),
          sections: []
        };
        
        // Convert sections
        if (zone.sections && Array.isArray(zone.sections)) {
          contentZone.sections = zone.sections.map(section => {
            const contentSection = {
              section_id: section.section_id,
              section_type: section.section_type,
              section_name: section.section_name,
              section_purpose: section.section_purpose,
              content_structure: mapLayoutToContentStructure(section.layout),
              content_flow: 'linear',
              blocks: []
            };
            
            // Convert blocks, removing styling
            if (section.blocks && Array.isArray(section.blocks)) {
              contentSection.blocks = section.blocks.map(block => {
                const contentBlock = {
                  block_id: block.block_id,
                  block_category: mapToContentCategory(block.block_category),
                  block_type: block.block_type,
                  content: extractContentData(block.content),
                  functionality: extractFunctionality(block),
                  metadata: {
                    created_date: new Date().toISOString(),
                    version: '1.0',
                    status: 'published'
                  }
                };
                
                // Add accessibility and SEO if present
                if (block.seo_properties) {
                  contentBlock.metadata.seo = block.seo_properties;
                }
                
                return contentBlock;
              });
            }
            
            return contentSection;
          });
        }
        
        return contentZone;
      });
    }
    
    return {
      success: true,
      data: contentStructure,
      metadata: {
        extraction_timestamp: new Date().toISOString(),
        conversion_type: 'styling_to_content_focused',
        schema_version: 'content_structure_v1.0'
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: null,
      metadata: {
        extraction_timestamp: new Date().toISOString(),
        error_type: error.name
      }
    };
  }
}

// Helper functions
function getContentStrategy(zoneType) {
  const strategies = {
    'hero_zone': 'attention_grabbing',
    'features_benefits_zone': 'value_demonstration',
    'social_proof_zone': 'trust_building',
    'product_showcase_zone': 'value_demonstration',
    'conversion_zone': 'conversion_focused',
    'education_zone': 'education',
    'resource_zone': 'support'
  };
  return strategies[zoneType] || 'engagement';
}

function mapLayoutToContentStructure(layout) {
  const mapping = {
    'centered_content': 'single_column',
    'single_column': 'single_column',
    'two_column': 'two_column',
    'masonry': 'grid',
    'hero_banner': 'hero_banner'
  };
  return mapping[layout] || 'single_column';
}

function mapToContentCategory(category) {
  const mapping = {
    'text_blocks': 'text_content',
    'visual_blocks': 'visual_content',
    'interactive_blocks': 'interactive_content',
    'data_blocks': 'data_content'
  };
  return mapping[category] || 'text_content';
}

function extractContentData(content) {
  if (!content) return {};
  
  const contentData = {};
  
  // Copy relevant content fields, excluding styling
  const contentFields = ['text', 'rich_text', 'alt_text', 'title', 'subtitle', 
                        'description', 'media_url', 'media_type', 'link_url', 
                        'link_target', 'items'];
  
  contentFields.forEach(field => {
    if (content[field] !== undefined) {
      contentData[field] = content[field];
    }
  });
  
  return contentData;
}

function extractFunctionality(block) {
  if (!block.content || !block.content.link_url) {
    return { interactive: false };
  }
  
  return {
    interactive: true,
    interaction_type: 'click',
    action_target: block.content.link_url,
    action_data: {
      target: block.content.link_target || '_self'
    }
  };
}

// Main execution - simplified for n8n compatibility
const inputData = $input.all();

// Process each input item and return n8n compatible format
const results = [];

for (let i = 0; i < inputData.length; i++) {
  const item = inputData[i];
  
  try {
    // Find the text content containing JSON
    let textContent = '';
    
    // Try different ways to get the content - more comprehensive approach
    if (item.json && typeof item.json === 'object' && item.json.output) {
      textContent = item.json.output;
    } else if (item.json && typeof item.json === 'string') {
      textContent = item.json;
    } else if (item.output) {
      textContent = item.output;
    } else if (typeof item === 'string') {
      textContent = item;
    } else if (item.json && typeof item.json === 'object') {
      // If json is an object, look for any string property that might contain the content
      const jsonObj = item.json;
      for (const [key, value] of Object.entries(jsonObj)) {
        if (typeof value === 'string' && value.includes('```json')) {
          textContent = value;
          break;
        }
      }
      // Also try common field names
      if (!textContent) {
        textContent = jsonObj.output || jsonObj.content || jsonObj.text || jsonObj.data || '';
      }
    } else {
      // Look for any string field containing JSON in the entire item
      const allValues = Object.values(item || {});
      const jsonContent = allValues.find(val => 
        typeof val === 'string' && val.includes('```json')
      );
      if (jsonContent) {
        textContent = jsonContent;
      } else {
        // Try nested objects
        for (const value of allValues) {
          if (typeof value === 'object' && value !== null) {
            const nestedValues = Object.values(value);
            const nestedJsonContent = nestedValues.find(val => 
              typeof val === 'string' && val.includes('```json')
            );
            if (nestedJsonContent) {
              textContent = nestedJsonContent;
              break;
            }
          }
        }
      }
    }
    
    if (!textContent) {
      // Enhanced debugging info
      let debugInfo = {
        item_keys: Object.keys(item || {}),
        item_type: typeof item,
        item_structure: {}
      };
      
      // Show structure of each property
      if (typeof item === 'object' && item !== null) {
        for (const [key, value] of Object.entries(item)) {
          debugInfo.item_structure[key] = {
            type: typeof value,
            is_string_with_json: typeof value === 'string' && value.includes('```json'),
            preview: typeof value === 'string' ? value.substring(0, 100) + '...' : 
                    typeof value === 'object' ? JSON.stringify(value, null, 2).substring(0, 200) + '...' :
                    String(value)
          };
        }
      }
      
      results.push({
        json: {
          success: false,
          error: 'No text content found',
          item_index: i,
          debug_info: debugInfo
        }
      });
      continue;
    }
    
    // Extract JSON from markdown - improved regex to handle multiple blocks
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/g;
    const matches = [];
    let match;
    
    while ((match = jsonRegex.exec(textContent)) !== null) {
      matches.push(match[1]);
    }
    
    if (matches.length === 0) {
      results.push({
        json: {
          success: false,
          error: 'No JSON block found',
          item_index: i,
          content_preview: textContent.substring(0, 200),
          content_length: textContent.length,
          has_json_marker: textContent.includes('```json'),
          has_closing_marker: textContent.includes('```')
        }
      });
      continue;
    }
    
    // Try each JSON block until we find a valid landing page structure
    let parsedData = null;
    let jsonString = '';
    
    for (let j = 0; j < matches.length; j++) {
      let jsonCandidate = matches[j].trim();
      
      try {
        // First try to parse as-is
        const candidateData = JSON.parse(jsonCandidate);
        if (candidateData.landing_page) {
          parsedData = candidateData;
          jsonString = jsonCandidate;
          break;
        } else if (!parsedData) {
          // Keep the first valid JSON even if it's not a landing page
          parsedData = candidateData;
          jsonString = jsonCandidate;
        }
      } catch (parseError) {
        // Try to fix common JSON truncation issues
        try {
          // Check if JSON is truncated and try to close it properly
          let fixedJson = jsonCandidate;
          
          // Count open/close braces and brackets
          const openBraces = (fixedJson.match(/\{/g) || []).length;
          const closeBraces = (fixedJson.match(/\}/g) || []).length;
          const openBrackets = (fixedJson.match(/\[/g) || []).length;
          const closeBrackets = (fixedJson.match(/\]/g) || []).length;
          
          // Add missing closing braces/brackets
          for (let k = 0; k < openBrackets - closeBrackets; k++) {
            fixedJson += ']';
          }
          for (let k = 0; k < openBraces - closeBraces; k++) {
            fixedJson += '}';
          }
          
          // Remove trailing comma if present
          fixedJson = fixedJson.replace(/,(\s*[}\]])]/g, '$1');
          
          const candidateData = JSON.parse(fixedJson);
          if (candidateData.landing_page) {
            parsedData = candidateData;
            jsonString = fixedJson;
            break;
          } else if (!parsedData) {
            parsedData = candidateData;
            jsonString = fixedJson;
          }
        } catch (fixError) {
          // Continue to next candidate
          continue;
        }
      }
    }
    
    if (!parsedData) {
      results.push({
        json: {
          success: false,
          error: 'No valid JSON found in any code block',
          item_index: i,
          json_blocks_found: matches.length,
          sample_block: matches[0] ? matches[0].substring(0, 200) + '...' : 'none'
        }
      });
      continue;
    }
    
    // Convert to content structure if it's a landing page
    if (parsedData.landing_page) {
      const conversionResult = convertToContentStructure([{ output: textContent }]);
      results.push({
        json: {
          success: true,
          item_index: i,
          data: conversionResult.data,
          metadata: conversionResult.metadata,
          extraction_info: {
            json_blocks_found: matches.length,
            json_string_length: jsonString.length
          }
        }
      });
    } else {
      // Return raw data if not a landing page structure
      results.push({
        json: {
          success: true,
          item_index: i,
          raw_data: parsedData,
          note: 'No landing_page structure detected',
          extraction_info: {
            json_blocks_found: matches.length,
            json_string_length: jsonString.length
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
        error_type: error.name
      }
    });
  }
}

return results;