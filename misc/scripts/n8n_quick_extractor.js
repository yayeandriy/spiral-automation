// N8N Quick Data Extractor
// Fast extraction of specific data points from response JSON

const items = $input.all();

function quickExtract(items) {
  const results = [];
  
  items.forEach((item, index) => {
    try {
      const outputText = item.json.output || item.json;
      
      // Extract JSON
      const jsonMatch = outputText.match(/```json\s*([\s\S]*?)\s*```/);
      if (!jsonMatch) {
        results.push({ json: { success: false, error: 'No JSON found', index } });
        return;
      }
      
      const data = JSON.parse(jsonMatch[1]);
      const landingPage = data.landing_page;
      
      if (!landingPage) {
        results.push({ json: { success: false, error: 'No landing_page found', index } });
        return;
      }
      
      // Quick extraction of key data points
      const extracted = {
        success: true,
        index,
        timestamp: new Date().toISOString(),
        
        // Page basics
        title: landingPage.metadata?.page_title || 'Untitled',
        type: landingPage.metadata?.page_type || 'unknown',
        audience: landingPage.metadata?.target_audience || 'unknown',
        
        // Structure counts
        zones_count: landingPage.zones?.length || 0,
        sections_count: 0,
        blocks_count: 0,
        
        // Content arrays
        images: [],
        links: [],
        text_blocks: [],
        headings: [],
        
        // Zone summary
        zone_types: [],
        zone_names: []
      };
      
      // Process zones quickly
      if (landingPage.zones) {
        landingPage.zones.forEach(zone => {
          extracted.zone_types.push(zone.zone_type);
          extracted.zone_names.push(zone.zone_name);
          
          if (zone.sections) {
            extracted.sections_count += zone.sections.length;
            
            zone.sections.forEach(section => {
              if (section.blocks) {
                extracted.blocks_count += section.blocks.length;
                
                section.blocks.forEach(block => {
                  const content = block.content || {};
                  
                  // Extract images
                  if (content.media_url) {
                    extracted.images.push({
                      url: content.media_url,
                      alt: content.alt_text || '',
                      type: content.media_type || 'image',
                      block_id: block.block_id,
                      zone: zone.zone_name
                    });
                  }
                  
                  // Extract links
                  if (content.link_url) {
                    extracted.links.push({
                      url: content.link_url,
                      text: content.text || '',
                      target: content.link_target || '_self',
                      block_id: block.block_id,
                      zone: zone.zone_name
                    });
                  }
                  
                  // Extract text content
                  if (content.text) {
                    const textData = {
                      text: content.text,
                      block_type: block.block_type,
                      block_id: block.block_id,
                      zone: zone.zone_name,
                      section: section.section_name
                    };
                    
                    // Separate headings from regular text
                    if (block.block_type && block.block_type.includes('headline')) {
                      extracted.headings.push(textData);
                    } else {
                      extracted.text_blocks.push(textData);
                    }
                  }
                  
                  // Extract list items
                  if (content.items && Array.isArray(content.items)) {
                    content.items.forEach(item => {
                      const itemText = typeof item === 'string' ? item : item.text || '';
                      if (itemText) {
                        extracted.text_blocks.push({
                          text: itemText,
                          block_type: 'list_item',
                          block_id: block.block_id,
                          zone: zone.zone_name,
                          section: section.section_name,
                          description: item.description || ''
                        });
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
      
      // Add summary stats
      extracted.summary = {
        total_images: extracted.images.length,
        total_links: extracted.links.length,
        total_text_blocks: extracted.text_blocks.length,
        total_headings: extracted.headings.length,
        external_links: extracted.links.filter(link => link.url.startsWith('http')).length,
        unique_domains: [...new Set(
          extracted.links
            .filter(link => link.url.startsWith('http'))
            .map(link => new URL(link.url).hostname)
        )],
        zone_distribution: extracted.zone_types.reduce((acc, type) => {
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {})
      };
      
      results.push({ json: extracted });
      
    } catch (error) {
      results.push({
        json: {
          success: false,
          error: error.message,
          index,
          error_type: error.name
        }
      });
    }
  });
  
  return results;
}

// For getting just specific data types, uncomment the desired filter:

// Filter for images only
// function getImagesOnly(items) {
//   const extracted = quickExtract(items);
//   return extracted.map(item => ({
//     json: {
//       success: item.json.success,
//       images: item.json.images || [],
//       count: item.json.images?.length || 0
//     }
//   }));
// }

// Filter for links only
// function getLinksOnly(items) {
//   const extracted = quickExtract(items);
//   return extracted.map(item => ({
//     json: {
//       success: item.json.success,
//       links: item.json.links || [],
//       count: item.json.links?.length || 0
//     }
//   }));
// }

// Filter for text content only
// function getTextOnly(items) {
//   const extracted = quickExtract(items);
//   return extracted.map(item => ({
//     json: {
//       success: item.json.success,
//       headings: item.json.headings || [],
//       text_blocks: item.json.text_blocks || [],
//       total_text_elements: (item.json.headings?.length || 0) + (item.json.text_blocks?.length || 0)
//     }
//   }));
// }

// Execute main extraction
return quickExtract(items);

// Or use specific filters:
// return getImagesOnly(items);
// return getLinksOnly(items);
// return getTextOnly(items);