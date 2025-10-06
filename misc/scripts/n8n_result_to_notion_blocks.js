// n8n JavaScript Code for Converting Documentation to Notion API Blocks
// This script converts structured documentation content to Notion API blocks format

// Helper function to create rich text array for Notion
function createRichTextArray(text, annotations = {}) {
  if (!text || text.trim() === '') {
    return [];
  }
  
  return [{
    type: "text",
    text: {
      content: text,
      link: null
    },
    annotations: {
      bold: annotations.bold || false,
      italic: annotations.italic || false,
      strikethrough: annotations.strikethrough || false,
      underline: annotations.underline || false,
      code: annotations.code || false,
      color: annotations.color || "default"
    },
    plain_text: text,
    href: null
  }];
}

// Helper function to parse markdown-style formatting
function parseFormattedText(text) {
  const parts = [];
  let currentIndex = 0;
  
  // Match **bold**, *italic*, `code`, etc.
  const patterns = [
    { regex: /\*\*(.*?)\*\*/g, annotation: { bold: true } },
    { regex: /\*(.*?)\*/g, annotation: { italic: true } },
    { regex: /`(.*?)`/g, annotation: { code: true } },
    { regex: /_(.*?)_/g, annotation: { underline: true } }
  ];
  
  let matches = [];
  
  // Find all formatting matches
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.regex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        content: match[1],
        annotation: pattern.annotation,
        fullMatch: match[0]
      });
    }
  });
  
  // Sort matches by position
  matches.sort((a, b) => a.start - b.start);
  
  // Build rich text array
  let position = 0;
  const richTextArray = [];
  
  matches.forEach(match => {
    // Add plain text before match
    if (position < match.start) {
      const plainText = text.substring(position, match.start);
      if (plainText) {
        richTextArray.push(...createRichTextArray(plainText));
      }
    }
    
    // Add formatted text
    richTextArray.push(...createRichTextArray(match.content, match.annotation));
    position = match.end;
  });
  
  // Add remaining plain text
  if (position < text.length) {
    const remainingText = text.substring(position);
    if (remainingText) {
      richTextArray.push(...createRichTextArray(remainingText));
    }
  }
  
  // If no formatting found, return plain text
  if (richTextArray.length === 0) {
    return createRichTextArray(text);
  }
  
  return richTextArray;
}

// Function to convert content lines to Notion blocks
function convertContentToBlocks(content) {
  const lines = content.split('\n');
  const blocks = [];
  
  let currentList = null;
  let currentListType = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Skip empty lines unless they break lists
    if (trimmedLine === '') {
      currentList = null;
      currentListType = null;
      continue;
    }
    
    // Handle headings
    if (trimmedLine.startsWith('# ')) {
      currentList = null;
      currentListType = null;
      blocks.push({
        object: "block",
        type: "heading_1",
        heading_1: {
          rich_text: parseFormattedText(trimmedLine.substring(2)),
          color: "default",
          is_toggleable: false
        }
      });
    }
    else if (trimmedLine.startsWith('## ')) {
      currentList = null;
      currentListType = null;
      blocks.push({
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: parseFormattedText(trimmedLine.substring(3)),
          color: "default",
          is_toggleable: false
        }
      });
    }
    else if (trimmedLine.startsWith('### ')) {
      currentList = null;
      currentListType = null;
      blocks.push({
        object: "block",
        type: "heading_3",
        heading_3: {
          rich_text: parseFormattedText(trimmedLine.substring(4)),
          color: "default",
          is_toggleable: false
        }
      });
    }
    // Handle bulleted lists
    else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      currentList = null;
      currentListType = null;
      blocks.push({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: parseFormattedText(trimmedLine.substring(2)),
          color: "default",
          children: []
        }
      });
    }
    // Handle numbered lists
    else if (/^\d+\.\s/.test(trimmedLine)) {
      currentList = null;
      currentListType = null;
      const match = trimmedLine.match(/^\d+\.\s(.*)$/);
      if (match) {
        blocks.push({
          object: "block",
          type: "numbered_list_item",
          numbered_list_item: {
            rich_text: parseFormattedText(match[1]),
            color: "default",
            children: []
          }
        });
      }
    }
    // Handle code blocks
    else if (trimmedLine.startsWith('```')) {
      currentList = null;
      currentListType = null;
      const language = trimmedLine.substring(3) || "plain_text";
      let codeContent = '';
      i++; // Move to next line
      
      // Collect code content until closing ```
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeContent += lines[i] + '\n';
        i++;
      }
      
      blocks.push({
        object: "block",
        type: "code",
        code: {
          rich_text: createRichTextArray(codeContent.trim()),
          caption: [],
          language: language
        }
      });
    }
    // Handle quotes
    else if (trimmedLine.startsWith('> ')) {
      currentList = null;
      currentListType = null;
      blocks.push({
        object: "block",
        type: "quote",
        quote: {
          rich_text: parseFormattedText(trimmedLine.substring(2)),
          color: "default",
          children: []
        }
      });
    }
    // Handle tables (basic support)
    else if (trimmedLine.includes('|') && trimmedLine.startsWith('|')) {
      currentList = null;
      currentListType = null;
      // For now, convert table rows to paragraphs
      const cells = trimmedLine.split('|').filter(cell => cell.trim() !== '');
      const tableText = cells.join(' | ');
      blocks.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: parseFormattedText(tableText),
          color: "default",
          children: []
        }
      });
    }
    // Handle dividers
    else if (trimmedLine === '---' || trimmedLine === '***') {
      currentList = null;
      currentListType = null;
      blocks.push({
        object: "block",
        type: "divider",
        divider: {}
      });
    }
    // Handle callouts (lines starting with **Key**, **Note**, etc.)
    else if (trimmedLine.startsWith('**') && (
      trimmedLine.toLowerCase().includes('key') ||
      trimmedLine.toLowerCase().includes('note') ||
      trimmedLine.toLowerCase().includes('important') ||
      trimmedLine.toLowerCase().includes('warning')
    )) {
      currentList = null;
      currentListType = null;
      blocks.push({
        object: "block",
        type: "callout",
        callout: {
          rich_text: parseFormattedText(trimmedLine),
          icon: { type: "emoji", emoji: "💡" },
          color: "default",
          children: []
        }
      });
    }
    // Handle regular paragraphs
    else {
      currentList = null;
      currentListType = null;
      blocks.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: parseFormattedText(trimmedLine),
          color: "default",
          children: []
        }
      });
    }
  }
  
  return blocks;
}

// Main conversion function
function convertResultToNotionBlocks(inputData) {
  try {
    // Parse input data
    const data = Array.isArray(inputData) ? inputData[0] : inputData;
    const content = data.output || data.content || data;
    
    if (typeof content !== 'string') {
      throw new Error('Input content must be a string');
    }
    
    // Convert content to Notion blocks
    const blocks = convertContentToBlocks(content);
    
    // Return in Notion API format
    return {
      children: blocks
    };
    
  } catch (error) {
    console.error('Error converting to Notion blocks:', error);
    return {
      error: error.message,
      children: [{
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: createRichTextArray(`Error processing content: ${error.message}`),
          color: "red",
          children: []
        }
      }]
    };
  }
}

// Extract sections with tags (for structured processing)
function extractSections(content) {
  const sections = [];
  const sectionRegex = /##\s*<!--\s*(\w+)\s*-->(.*?)(?=##\s*<!--|\s*$)/gs;
  let match;
  
  while ((match = sectionRegex.exec(content)) !== null) {
    const tag = match[1];
    const sectionContent = match[2].trim();
    const nameMatch = sectionContent.match(/^([^\n]+)/);
    const name = nameMatch ? nameMatch[1].trim() : tag;
    
    sections.push({
      name: name,
      tag: tag,
      content: sectionContent,
      blocks: convertContentToBlocks(sectionContent)
    });
  }
  
  return sections;
}

// Main execution for n8n
const inputData = $input.all()[0].json;

// Option 1: Convert entire content to blocks
const notionBlocks = convertResultToNotionBlocks(inputData);

// Option 2: Extract sections for structured processing
const sections = extractSections(inputData.output || inputData.content || inputData);

// Return both formats
return [
  {
    json: {
      fullContent: notionBlocks,
      sections: sections,
      sectionCount: sections.length,
      blockCount: notionBlocks.children.length
    }
  }
];