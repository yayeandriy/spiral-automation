// N8N Content Schema Converter
// Converts extracted response data to the new content-focused schema format

const items = $input.all();

function convertToContentSchema(items) {
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
            item_index: index
          }
        });
        return;
      }
      
      // Extract JSON from markdown code blocks
      const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
      const match = outputText.match(jsonRegex);
      
      if (!match || !match[1]) {
        results.push({
          json: {
            success: false,
            error: 'No JSON block found in output',
            item_index: index
          }
        });
        return;
      }
      
      const originalData = JSON.parse(match[1]);
      
      if (!originalData.landing_page) {
        results.push({
          json: {
            success: false,
            error: 'No landing_page structure found',
            item_index: index
          }
        });
        return;
      }
      
      const landingPage = originalData.landing_page;
      
      // Convert to new content-focused schema
      const contentStructure = {
        landing_content: {
          metadata: {
            page_title: landingPage.metadata?.page_title || 'Untitled Page',
            page_type: landingPage.metadata?.page_type || 'consumer_hardware',
            target_audience: landingPage.metadata?.target_audience || 'b2b',
            conversion_strategy: landingPage.metadata?.conversion_strategy || 'demo_request',
            content_language: 'en-US',
            created_date: new Date().toISOString(),
            last_modified: new Date().toISOString(),
            version: '1.0'
          },
          zones: []
        }
      };
      
      // Convert zones
      if (landingPage.zones && Array.isArray(landingPage.zones)) {
        contentStructure.landing_content.zones = landingPage.zones.map(zone => {
          const contentZone = {
            zone_id: zone.zone_id,
            zone_type: zone.zone_type,
            zone_name: zone.zone_name,
            zone_purpose: zone.zone_purpose,
            position: zone.position,
            is_above_fold: zone.is_above_fold || false,
            priority: mapPriority(zone.viewport_priority),
            content_strategy: mapContentStrategy(zone.zone_type),
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
                content_structure: mapContentStructure(section.layout),
                content_flow: 'linear',
                blocks: []
              };
              
              // Convert blocks
              if (section.blocks && Array.isArray(section.blocks)) {
                contentSection.blocks = section.blocks.map(block => {
                  const contentBlock = {
                    block_id: block.block_id,
                    block_category: mapBlockCategory(block.block_category),
                    block_type: block.block_type,
                    content: extractContentData(block.content),
                    functionality: extractFunctionality(block),
                    metadata: {
                      created_date: new Date().toISOString(),
                      version: '1.0',
                      status: 'published'
                    }
                  };
                  
                  // Add SEO properties if present
                  if (block.seo_properties) {
                    contentBlock.metadata.seo = {
                      heading_level: block.seo_properties.heading_level,
                      keywords: [],
                      structured_data: {}
                    };
                  }
                  
                  // Add accessibility properties for interactive elements
                  if (block.content && (block.content.link_url || block.block_type.includes('button'))) {
                    contentBlock.metadata.accessibility = {
                      keyboard_navigation: true,
                      focusable: true
                    };
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
      
      results.push({
        json: {
          success: true,
          item_index: index,
          conversion_timestamp: new Date().toISOString(),
          schema_version: 'content_structure_v1.0',
          data: contentStructure,
          
          // Summary information
          summary: {
            zones_converted: contentStructure.landing_content.zones.length,
            sections_converted: contentStructure.landing_content.zones.reduce((sum, zone) => sum + zone.sections.length, 0),
            blocks_converted: contentStructure.landing_content.zones.reduce((sum, zone) => 
              sum + zone.sections.reduce((sectionSum, section) => sectionSum + section.blocks.length, 0), 0
            ),
            content_types_found: getContentTypes(contentStructure.landing_content.zones)
          }
        }
      });
      
    } catch (error) {
      results.push({
        json: {
          success: false,
          error: error.message,
          item_index: index,
          error_type: error.name
        }
      });
    }
  });
  
  return results;
}

// Helper functions
function mapPriority(viewportPriority) {
  const priorityMap = {
    'critical': 'critical',
    'important': 'high',
    'secondary': 'medium',
    'optional': 'low'
  };
  return priorityMap[viewportPriority] || 'medium';
}

function mapContentStrategy(zoneType) {
  const strategyMap = {
    'hero_zone': 'attention_grabbing',
    'features_benefits_zone': 'value_demonstration',
    'social_proof_zone': 'trust_building',
    'product_showcase_zone': 'value_demonstration',
    'conversion_zone': 'conversion_focused',
    'education_zone': 'education',
    'comparison_zone': 'value_demonstration',
    'integration_zone': 'education',
    'community_zone': 'engagement',
    'security_trust_zone': 'trust_building',
    'pricing_value_zone': 'conversion_focused',
    'resource_zone': 'support'
  };
  return strategyMap[zoneType] || 'engagement';
}

function mapContentStructure(layout) {
  const structureMap = {
    'single_column': 'single_column',
    'two_column': 'two_column',
    'three_column': 'three_column',
    'four_column': 'four_column',
    'grid': 'grid',
    'carousel': 'carousel',
    'accordion': 'accordion',
    'tabs': 'tabs',
    'hero_banner': 'hero_banner',
    'split_screen': 'split_content',
    'masonry': 'masonry',
    'timeline': 'timeline',
    'centered_content': 'single_column',
    'full_width': 'single_column'
  };
  return structureMap[layout] || 'single_column';
}

function mapBlockCategory(category) {
  const categoryMap = {
    'text_blocks': 'text_content',
    'visual_blocks': 'visual_content',
    'interactive_blocks': 'interactive_content',
    'social_proof_blocks': 'social_proof_content',
    'data_blocks': 'data_content',
    'media_blocks': 'media_content',
    'form_blocks': 'form_content',
    'navigation_blocks': 'navigation_content',
    'widget_blocks': 'widget_content'
  };
  return categoryMap[category] || 'text_content';
}

function extractContentData(originalContent) {
  if (!originalContent) return {};
  
  const contentData = {};
  
  // Map content fields, excluding styling
  const contentFields = [
    'text', 'rich_text', 'alt_text', 'title', 'subtitle', 'description',
    'media_url', 'media_type', 'link_url', 'link_target', 'link_rel', 'items'
  ];
  
  contentFields.forEach(field => {
    if (originalContent[field] !== undefined) {
      contentData[field] = originalContent[field];
    }
  });
  
  // Handle media sources for responsive content
  if (originalContent.media_url) {
    contentData.media_sources = [{
      url: originalContent.media_url,
      format: getFileExtension(originalContent.media_url),
      quality: 'medium',
      device: 'all'
    }];
  }
  
  return contentData;
}

function extractFunctionality(block) {
  const functionality = {
    interactive: false
  };
  
  if (!block.content) return functionality;
  
  // Check for interactive elements
  if (block.content.link_url) {
    functionality.interactive = true;
    functionality.interaction_type = 'click';
    functionality.action_target = block.content.link_url;
    functionality.action_data = {
      target: block.content.link_target || '_self'
    };
    
    // Add tracking for external links
    if (block.content.link_url.startsWith('http')) {
      functionality.tracking = {
        analytics_event: 'external_link_click',
        custom_attributes: {
          url: block.content.link_url,
          block_type: block.block_type
        }
      };
    }
  }
  
  // Check for form elements
  if (block.block_type && (block.block_type.includes('form') || block.block_type.includes('button'))) {
    functionality.interactive = true;
    functionality.interaction_type = block.block_type.includes('form') ? 'form_submit' : 'click';
  }
  
  return functionality;
}

function getContentTypes(zones) {
  const contentTypes = new Set();
  
  zones.forEach(zone => {
    zone.sections.forEach(section => {
      section.blocks.forEach(block => {
        contentTypes.add(block.block_type);
        
        if (block.content.media_url) contentTypes.add('media');
        if (block.content.link_url) contentTypes.add('links');
        if (block.content.items) contentTypes.add('lists');
        if (block.content.text) contentTypes.add('text');
      });
    });
  });
  
  return Array.from(contentTypes);
}

function getFileExtension(url) {
  if (!url) return 'unknown';
  const extension = url.split('.').pop().toLowerCase();
  return extension.split('?')[0]; // Remove query parameters
}

// Execute conversion
return convertToContentSchema(items);