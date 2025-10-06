// Simple N8N JSON Extractor - Fixed Version
// Handles various input formats and extracts JSON from markdown blocks

// Get input data from n8n
const items = $input.all();

// Simple extraction function
function extractJson(items) {
  const results = [];
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    try {
      // Find the text content that contains JSON
      let textContent = '';
      
      // Try different paths to find the content
      if (item.json && item.json.output) {
        textContent = item.json.output;
      } else if (item.json && typeof item.json === 'string') {
        textContent = item.json;
      } else if (item.output) {
        textContent = item.output;
      } else if (typeof item === 'string') {
        textContent = item;
      } else {
        // Search through all string properties
        for (const [key, value] of Object.entries(item)) {
          if (typeof value === 'string' && value.includes('```json')) {
            textContent = value;
            break;
          }
        }
      }
      
      if (!textContent) {
        results.push({
          success: false,
          error: 'No text content found',
          index: i,
          available_keys: Object.keys(item)
        });
        continue;
      }
      
      // Extract JSON from markdown code blocks
      const jsonMatch = textContent.match(/```json\s*([\s\S]*?)\s*```/);
      
      if (!jsonMatch || !jsonMatch[1]) {
        results.push({
          success: false,
          error: 'No JSON code block found',
          index: i,
          content_preview: textContent.substring(0, 200) + '...'
        });
        continue;
      }
      
      // Parse the JSON
      const jsonString = jsonMatch[1].trim();
      const parsedData = JSON.parse(jsonString);
      
      // Extract basic information
      let extractedInfo = {
        success: true,
        index: i,
        timestamp: new Date().toISOString(),
        raw_data: parsedData
      };
      
      // If it's a landing page structure, extract key info
      if (parsedData.landing_page) {
        const lp = parsedData.landing_page;
        extractedInfo.page_info = {
          title: lp.metadata?.page_title || 'Untitled',
          type: lp.metadata?.page_type || 'unknown',
          zones_count: lp.zones?.length || 0
        };
        
        // Extract all text content
        extractedInfo.content = {
          texts: [],
          images: [],
          links: []
        };
        
        // Process zones if they exist
        if (lp.zones && Array.isArray(lp.zones)) {
          lp.zones.forEach(zone => {
            if (zone.sections && Array.isArray(zone.sections)) {
              zone.sections.forEach(section => {
                if (section.blocks && Array.isArray(section.blocks)) {
                  section.blocks.forEach(block => {
                    if (block.content) {
                      // Extract text
                      if (block.content.text) {
                        extractedInfo.content.texts.push({
                          text: block.content.text,
                          type: block.block_type,
                          zone: zone.zone_name
                        });
                      }
                      
                      // Extract images
                      if (block.content.media_url) {
                        extractedInfo.content.images.push({
                          url: block.content.media_url,
                          alt: block.content.alt_text || '',
                          zone: zone.zone_name
                        });
                      }
                      
                      // Extract links
                      if (block.content.link_url) {
                        extractedInfo.content.links.push({
                          url: block.content.link_url,
                          text: block.content.text || '',
                          zone: zone.zone_name
                        });
                      }
                      
                      // Extract list items
                      if (block.content.items && Array.isArray(block.content.items)) {
                        block.content.items.forEach(listItem => {
                          const itemText = typeof listItem === 'string' ? listItem : listItem.text;
                          if (itemText) {
                            extractedInfo.content.texts.push({
                              text: itemText,
                              type: 'list_item',
                              zone: zone.zone_name,
                              description: listItem.description || ''
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
        
        // Add summary
        extractedInfo.summary = {
          total_texts: extractedInfo.content.texts.length,
          total_images: extractedInfo.content.images.length,
          total_links: extractedInfo.content.links.length
        };
      }
      
      results.push(extractedInfo);
      
    } catch (error) {
      results.push({
        success: false,
        error: error.message,
        index: i,
        error_type: error.name,
        item_structure: Object.keys(item)
      });
    }
  }
  
  return results;
}

// Execute and return results
const results = extractJson(items);

// Return as individual items for n8n
return results.map(result => ({ json: result }));