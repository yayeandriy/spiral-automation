// Simplified N8N JavaScript Code for Response JSON Extraction
// Handles the specific format: [{"output": "text with ```json...``` embedded"}]

// Get the input data from n8n
const items = $input.all();

// Main processing function
function processResponse(items) {
  const results = [];
  
  items.forEach((item, index) => {
    try {
      // Extract the output string
      const outputText = item.json.output || item.json;
      
      if (typeof outputText !== 'string') {
        results.push({
          json: {
            success: false,
            error: 'Output is not a string',
            item_index: index,
            original_data: item.json
          }
        });
        return;
      }
      
      // Extract JSON from markdown code blocks
      const jsonRegex = /```json\s*([\s\S]*?)\s*```/g;
      const matches = [];
      let match;
      
      while ((match = jsonRegex.exec(outputText)) !== null) {
        matches.push(match[1]);
      }
      
      if (matches.length === 0) {
        results.push({
          json: {
            success: false,
            error: 'No JSON blocks found in output',
            item_index: index,
            output_preview: outputText.substring(0, 200) + '...'
          }
        });
        return;
      }
      
      // Parse the first JSON block found
      const jsonString = matches[0];
      const parsedJson = JSON.parse(jsonString);
      
      // Extract landing page data
      if (parsedJson.landing_page) {
        const landingPage = parsedJson.landing_page;
        
        // Create simplified output
        const extracted = {
          success: true,
          item_index: index,
          extraction_timestamp: new Date().toISOString(),
          
          // Page metadata
          page_info: {
            title: landingPage.metadata?.page_title || 'Untitled',
            type: landingPage.metadata?.page_type || 'unknown',
            target_audience: landingPage.metadata?.target_audience || 'unknown',
            conversion_strategy: landingPage.metadata?.conversion_strategy || 'unknown'
          },
          
          // Summary statistics
          summary: {
            total_zones: landingPage.zones?.length || 0,
            total_sections: 0,
            total_blocks: 0,
            zone_types: [],
            has_images: false,
            has_links: false
          },
          
          // Zones with nested content
          zones: [],
          
          // Flattened arrays for easy access
          all_sections: [],
          all_blocks: [],
          all_images: [],
          all_links: [],
          all_text_content: []
        };
        
        // Process zones
        if (landingPage.zones && Array.isArray(landingPage.zones)) {
          landingPage.zones.forEach(zone => {
            const processedZone = {
              id: zone.zone_id,
              type: zone.zone_type,
              name: zone.zone_name,
              purpose: zone.zone_purpose,
              position: zone.position,
              above_fold: zone.is_above_fold,
              sections: []
            };
            
            // Track zone type
            if (zone.zone_type && !extracted.summary.zone_types.includes(zone.zone_type)) {
              extracted.summary.zone_types.push(zone.zone_type);
            }
            
            // Process sections
            if (zone.sections && Array.isArray(zone.sections)) {
              zone.sections.forEach(section => {
                const processedSection = {
                  id: section.section_id,
                  type: section.section_type,
                  name: section.section_name,
                  purpose: section.section_purpose,
                  layout: section.layout,
                  zone_id: zone.zone_id,
                  blocks: []
                };
                
                extracted.summary.total_sections++;
                
                // Process blocks
                if (section.blocks && Array.isArray(section.blocks)) {
                  section.blocks.forEach(block => {
                    const processedBlock = {
                      id: block.block_id,
                      category: block.block_category,
                      type: block.block_type,
                      section_id: section.section_id,
                      zone_id: zone.zone_id,
                      content: {}
                    };
                    
                    extracted.summary.total_blocks++;
                    
                    // Extract content
                    if (block.content) {
                      // Text content
                      if (block.content.text) {
                        processedBlock.content.text = block.content.text;
                        extracted.all_text_content.push({
                          text: block.content.text,
                          block_id: block.block_id,
                          block_type: block.block_type,
                          context: `${zone.zone_name} > ${section.section_name}`
                        });
                      }
                      
                      // Media content
                      if (block.content.media_url) {
                        processedBlock.content.media = {
                          url: block.content.media_url,
                          type: block.content.media_type,
                          alt_text: block.content.alt_text
                        };
                        
                        extracted.all_images.push({
                          url: block.content.media_url,
                          type: block.content.media_type || 'image',
                          alt_text: block.content.alt_text || '',
                          block_id: block.block_id,
                          context: `${zone.zone_name} > ${section.section_name}`,
                          filename: block.content.media_url.split('/').pop()
                        });
                        
                        extracted.summary.has_images = true;
                      }
                      
                      // Link content
                      if (block.content.link_url) {
                        processedBlock.content.link = {
                          url: block.content.link_url,
                          target: block.content.link_target,
                          text: block.content.text
                        };
                        
                        extracted.all_links.push({
                          url: block.content.link_url,
                          text: block.content.text || '',
                          target: block.content.link_target || '_self',
                          block_id: block.block_id,
                          context: `${zone.zone_name} > ${section.section_name}`,
                          domain: new URL(block.content.link_url).hostname
                        });
                        
                        extracted.summary.has_links = true;
                      }
                      
                      // List items
                      if (block.content.items && Array.isArray(block.content.items)) {
                        processedBlock.content.items = block.content.items;
                        
                        block.content.items.forEach(item => {
                          if (typeof item === 'string') {
                            extracted.all_text_content.push({
                              text: item,
                              block_id: block.block_id,
                              block_type: 'list_item',
                              context: `${zone.zone_name} > ${section.section_name}`
                            });
                          } else if (item.text) {
                            extracted.all_text_content.push({
                              text: item.text,
                              description: item.description,
                              block_id: block.block_id,
                              block_type: 'list_item',
                              context: `${zone.zone_name} > ${section.section_name}`
                            });
                          }
                        });
                      }
                    }
                    
                    processedSection.blocks.push(processedBlock);
                    extracted.all_blocks.push(processedBlock);
                  });
                }
                
                processedZone.sections.push(processedSection);
                extracted.all_sections.push(processedSection);
              });
            }
            
            extracted.zones.push(processedZone);
          });
        }
        
        results.push({ json: extracted });
        
      } else {
        // If no landing_page structure, return raw parsed JSON
        results.push({
          json: {
            success: true,
            item_index: index,
            extraction_timestamp: new Date().toISOString(),
            raw_data: parsedJson,
            note: 'No landing_page structure found, returning raw parsed JSON'
          }
        });
      }
      
    } catch (error) {
      results.push({
        json: {
          success: false,
          error: error.message,
          item_index: index,
          error_type: error.name,
          stack: error.stack
        }
      });
    }
  });
  
  return results;
}

// Execute and return results
return processResponse(items);