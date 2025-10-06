// N8N JavaScript Code to convert docs_output.json into Notion API blocks
// This code transforms the structured content into proper Notion block format

// Helper function to parse text with markdown formatting
function parseMarkdownText(text) {
  if (!text) return [];
  
  const richTextArray = [];
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|[🔥💡⚡🎯📊✅❌⭐🚀💰🔧📈📋✨🎉💪🏆🔍📱💻⚙️📞✉️🏢🌐📄📊📈📉📋📝📖📚📑📓📒📕📗📘📙📔📰🗞️📄📃📜📊📈📉📋📝📖📚])/);
  
  for (let part of parts) {
    if (!part) continue;
    
    // Bold text
    if (part.startsWith('**') && part.endsWith('**')) {
      richTextArray.push({
        type: "text",
        text: {
          content: part.slice(2, -2)
        },
        annotations: {
          bold: true
        }
      });
    }
    // Italic text
    else if (part.startsWith('*') && part.endsWith('*')) {
      richTextArray.push({
        type: "text",
        text: {
          content: part.slice(1, -1)
        },
        annotations: {
          italic: true
        }
      });
    }
    // Code text
    else if (part.startsWith('`') && part.endsWith('`')) {
      richTextArray.push({
        type: "text",
        text: {
          content: part.slice(1, -1)
        },
        annotations: {
          code: true
        }
      });
    }
    // Links
    else if (part.match(/\[([^\]]+)\]\(([^)]+)\)/)) {
      const match = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
      richTextArray.push({
        type: "text",
        text: {
          content: match[1],
          link: {
            url: match[2]
          }
        }
      });
    }
    // Emojis and regular text
    else {
      richTextArray.push({
        type: "text",
        text: {
          content: part
        }
      });
    }
  }
  
  return richTextArray;
}

// Helper function to create a paragraph block
function createParagraphBlock(text, color = "default") {
  return {
    type: "paragraph",
    paragraph: {
      rich_text: parseMarkdownText(text),
      color: color
    }
  };
}

// Helper function to create heading blocks
function createHeadingBlock(text, level = 1, color = "default") {
  const headingType = `heading_${level}`;
  return {
    type: headingType,
    [headingType]: {
      rich_text: parseMarkdownText(text),
      color: color
    }
  };
}

// Helper function to create bulleted list items
function createBulletedListItem(text) {
  return {
    type: "bulleted_list_item",
    bulleted_list_item: {
      rich_text: parseMarkdownText(text)
    }
  };
}

// Helper function to create callout blocks
function createCalloutBlock(text, icon = "💡", color = "blue_background") {
  return {
    type: "callout",
    callout: {
      rich_text: parseMarkdownText(text),
      icon: {
        type: "emoji",
        emoji: icon
      },
      color: color
    }
  };
}

// Helper function to create divider
function createDivider() {
  return {
    type: "divider",
    divider: {}
  };
}

// Helper function to create table block
function createTableBlock(headers, rows, title = null) {
  const tableBlocks = [];
  
  // Add title if provided
  if (title) {
    tableBlocks.push(createHeadingBlock(title, 3));
  }
  
  // Create table with header row
  const tableChildren = [];
  
  // Header row
  tableChildren.push({
    type: "table_row",
    table_row: {
      cells: headers.map(header => parseMarkdownText(header))
    }
  });
  
  // Data rows
  rows.forEach(row => {
    tableChildren.push({
      type: "table_row",
      table_row: {
        cells: row.map(cell => parseMarkdownText(String(cell)))
      }
    });
  });
  
  tableBlocks.push({
    type: "table",
    table: {
      table_width: headers.length,
      has_column_header: true,
      has_row_header: false,
      children: tableChildren
    }
  });
  
  return tableBlocks;
}

// Main conversion function
function convertDocsToNotionBlocks(docsData) {
  const notionBlocks = [];
  
  try {
    // Handle the nested array structure in docs_output.json
    let sections = [];
    
    // Debug: log the structure to understand it better
    console.log('Input data structure:', JSON.stringify(docsData, null, 2));
    
    if (Array.isArray(docsData)) {
      // If docsData is directly an array
      if (docsData[0] && docsData[0].sections) {
        if (Array.isArray(docsData[0].sections) && Array.isArray(docsData[0].sections[0])) {
          sections = docsData[0].sections[0]; // Nested array case
        } else {
          sections = docsData[0].sections; // Direct array case
        }
      }
    } else if (docsData.sections) {
      // If docsData is an object with sections
      if (Array.isArray(docsData.sections) && Array.isArray(docsData.sections[0])) {
        sections = docsData.sections[0]; // Nested array case
      } else {
        sections = docsData.sections; // Direct array case
      }
    }
    
    console.log('Extracted sections:', sections.length, 'sections found');
    
    sections.forEach((section, sectionIndex) => {
      const { content, section_name } = section;
      
      // Add section divider (except for first section)
      if (sectionIndex > 0) {
        notionBlocks.push(createDivider());
      }
      
      // Add section header
      if (content.headline) {
        notionBlocks.push(createHeadingBlock(content.headline, 1, "blue"));
      }
      
      if (content.subheadline) {
        notionBlocks.push(createParagraphBlock(content.subheadline, "gray"));
      }
      
      // Process blocks within the section
      if (content.blocks && Array.isArray(content.blocks)) {
        content.blocks.forEach(block => {
          switch (block.block_type) {
            case 'headline':
              notionBlocks.push(createHeadingBlock(block.content.text, 2, "orange"));
              break;
              
            case 'text_content':
              // Handle list items vs regular paragraphs
              const text = block.content.text;
              if (text.includes('\n-') || text.includes('\n•') || text.includes('\n1️⃣') || text.includes('\n2️⃣') || text.includes('\n3️⃣')) {
                // Split into list items
                const lines = text.split('\n');
                lines.forEach(line => {
                  if (line.trim()) {
                    if (line.includes('- **') || line.includes('• ') || line.includes('️⃣')) {
                      // Remove list markers and create bulleted list item
                      const cleanLine = line.replace(/^[\s-•1-3️⃣]*/, '').trim();
                      if (cleanLine) {
                        notionBlocks.push(createBulletedListItem(cleanLine));
                      }
                    } else {
                      notionBlocks.push(createParagraphBlock(line));
                    }
                  }
                });
              } else {
                notionBlocks.push(createParagraphBlock(text));
              }
              break;
              
            case 'video':
              notionBlocks.push(createCalloutBlock(
                `🎥 ${block.content.title}`, 
                "🎥", 
                "purple_background"
              ));
              if (block.content.url) {
                notionBlocks.push(createParagraphBlock(`Watch: ${block.content.url}`));
              }
              break;
              
            case 'notion_table':
            case 'table':
              const tableData = block.content;
              const tableBlocks = createTableBlock(
                tableData.headers || tableData.columns,
                tableData.rows,
                tableData.title
              );
              notionBlocks.push(...tableBlocks);
              
              // Add footer note if present
              if (tableData.footer_note) {
                notionBlocks.push(createParagraphBlock(`*${tableData.footer_note}*`, "gray"));
              }
              break;
              
            default:
              // Fallback for unknown block types
              notionBlocks.push(createParagraphBlock(
                `[${block.block_type}] ${block.content.text || JSON.stringify(block.content)}`
              ));
          }
        });
      }
    });
    
    return notionBlocks;
    
  } catch (error) {
    console.error('Error converting docs to Notion blocks:', error);
    return [
      createCalloutBlock(`Error processing content: ${error.message}`, "❌", "red_background")
    ];
  }
}

// N8N execution context
// Loop over input items and convert each one
for (const item of $input.all()) {
  try {
    const docsData = item.json;
    const notionBlocks = convertDocsToNotionBlocks(docsData);
    
    // Add the converted blocks to the item and remove original sections
    item.json.notion_blocks = {
      children: notionBlocks
    };
    item.json.block_count = notionBlocks.length;
    item.json.conversion_timestamp = new Date().toISOString();
    item.json.conversion_status = "success";
    
    // Remove the original sections to clean up output
    delete item.json.sections;
    
    // Add debug info
    item.json.debug_info = {
      original_structure_type: Array.isArray(docsData) ? 'array' : 'object',
      sections_found: notionBlocks.length > 0 ? 'yes' : 'no',
      input_keys: Object.keys(docsData)
    };
    
  } catch (error) {
    console.error('Error in N8N conversion:', error);
    item.json.notion_blocks = {
      children: [
        {
          type: "callout",
          callout: {
            rich_text: [{
              type: "text",
              text: {
                content: `Error converting content: ${error.message}`
              }
            }],
            icon: {
              type: "emoji",
              emoji: "❌"
            },
            color: "red_background"
          }
        }
      ]
    };
    item.json.block_count = 1;
    item.json.conversion_status = "error";
    item.json.error_message = error.message;
  }
}

return $input.all();