// n8n Code Node - Convert Response to Notion Blocks
// Place this code in an n8n "Code" node

// Get input data - check output, content, response fields
const inputData = $input.all()[0].json;
const responseText = inputData.output || inputData.content || inputData.response || JSON.stringify(inputData);

// Helper functions for creating Notion blocks
const createBlock = {
  heading: (level, text, color = "default") => ({
    type: `heading_${level}`,
    [`heading_${level}`]: {
      rich_text: [{ 
        type: "text", 
        text: { content: text }, 
        annotations: { bold: true, color } 
      }]
    }
  }),
  
  paragraph: (text, annotations = {}) => ({
    type: "paragraph",
    paragraph: {
      rich_text: [{ 
        type: "text", 
        text: { content: text }, 
        annotations: { bold: false, italic: false, ...annotations } 
      }]
    }
  }),
  
  callout: (text, emoji = "💡", color = "default") => ({
    type: "callout",
    callout: {
      rich_text: [{ type: "text", text: { content: text } }],
      icon: { type: "emoji", emoji },
      color
    }
  }),
  
  bulletList: (text, bold = false) => ({
    type: "bulleted_list_item",
    bulleted_list_item: {
      rich_text: [{ 
        type: "text", 
        text: { content: text }, 
        annotations: { bold } 
      }]
    }
  }),
  
  numberedList: (text) => ({
    type: "numbered_list_item",
    numbered_list_item: {
      rich_text: [{ type: "text", text: { content: text } }]
    }
  }),
  
  divider: () => ({ type: "divider", divider: {} }),
  
  code: (text, language = "json") => ({
    type: "code",
    code: {
      rich_text: [{ type: "text", text: { content: text } }],
      language
    }
  })
};

// Parse text into Notion blocks
function parseToNotionBlocks(text) {
  const blocks = [];
  const lines = text.split('\n');
  let inCodeBlock = false;
  let codeContent = [];
  let codeLanguage = "json";
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Handle code blocks
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        blocks.push(createBlock.code(codeContent.join('\n'), codeLanguage));
        inCodeBlock = false;
        codeContent = [];
      } else {
        inCodeBlock = true;
        codeLanguage = trimmed.replace('```', '') || "json";
      }
      continue;
    }
    
    if (inCodeBlock) {
      codeContent.push(line);
      continue;
    }
    
    if (!trimmed) continue;
    
    // Parse different line types
    if (trimmed.startsWith('# ')) {
      blocks.push(createBlock.heading(1, trimmed.substring(2), "blue"));
    }
    else if (trimmed.startsWith('## ')) {
      const content = trimmed.substring(3);
      // Remove emoji prefix if present
      const cleanContent = content.replace(/^[🎯⚡🚀💡🔧📊📈🛡️⭐🔍]+\s*/, '');
      blocks.push(createBlock.heading(2, cleanContent));
    }
    else if (trimmed.startsWith('### ')) {
      blocks.push(createBlock.heading(3, trimmed.substring(4)));
    }
    else if (trimmed.match(/^[-*]\s/)) {
      const content = trimmed.substring(2);
      const isBold = content.includes('±') || content.includes('Point ') || content.includes('**');
      blocks.push(createBlock.bulletList(content.replace(/\*\*/g, ''), isBold));
    }
    else if (trimmed.match(/^\d+\.\s/)) {
      const content = trimmed.replace(/^\d+\.\s+/, '');
      blocks.push(createBlock.numberedList(content));
    }
    else if (trimmed.includes('Revolutionary AI-powered') || trimmed.includes('🛩️')) {
      const content = trimmed.replace(/🛩️/g, '').trim();
      blocks.push(createBlock.callout(content, "🛩️", "blue_background"));
    }
    else if (trimmed.includes('🚀 Performance Impact:')) {
      const content = trimmed.replace('🚀 Performance Impact:', '').trim();
      blocks.push(createBlock.callout(content, "🚀", "green_background"));
    }
    else if (trimmed === '---') {
      blocks.push(createBlock.divider());
    }
    else {
      const isItalic = trimmed.includes('Precision Computer Vision');
      blocks.push(createBlock.paragraph(trimmed, { 
        italic: isItalic, 
        color: isItalic ? "gray" : "default" 
      }));
    }
  }
  
  return blocks;
}

// Check if content already has Notion blocks, otherwise parse
function extractExistingBlocks(text) {
  try {
    const jsonStart = text.indexOf('```json');
    const jsonEnd = text.indexOf('```', jsonStart + 7);
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      const jsonContent = text.substring(jsonStart + 7, jsonEnd).trim();
      const parsedJson = JSON.parse(jsonContent);
      if (parsedJson.children && Array.isArray(parsedJson.children)) {
        return parsedJson;
      }
    }
    
    const directJson = JSON.parse(text);
    if (directJson.children && Array.isArray(directJson.children)) {
      return directJson;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

// Extract existing blocks or parse the text
const existingBlocks = extractExistingBlocks(responseText);
const notionPayload = existingBlocks || {
  children: parseToNotionBlocks(responseText)
};

// Return the result for n8n
return {
  notion_blocks: notionPayload,
  block_count: notionBlocks.length,
  raw_input: responseText.substring(0, 200) + "...", // First 200 chars for debugging
  success: true
};