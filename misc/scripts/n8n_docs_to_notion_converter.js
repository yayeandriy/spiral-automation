// n8n JavaScript Code for converting structured document response to Notion blocks
// Handles any similar document structure with metadata, sections, and content blocks

// Get input data - expects the parsed response format
const inputData = $input.all()[0].json;

console.log('Processing document conversion to Notion blocks...');

if (!inputData || !inputData.document) {
  throw new Error('Invalid input: Expected document structure not found');
}

const document = inputData.document.document || inputData.document;

/**
 * Convert color styles to Notion colors
 */
function convertColor(styleString) {
  if (!styleString) return 'default';
  
  const colorMap = {
    'green': 'green',
    'red': 'red',
    'blue': 'blue',
    'orange': 'orange',
    'yellow': 'yellow',
    'purple': 'purple',
    'pink': 'pink',
    'gray': 'gray',
    'brown': 'brown'
  };

  const colorMatch = styleString.match(/color:\s*([^;]+)/i);
  if (colorMatch) {
    const color = colorMatch[1].trim().toLowerCase();
    return colorMap[color] || 'default';
  }
  
  return 'default';
}

/**
 * Convert rich text content to Notion rich text format
 */
function convertRichText(content) {
  if (!content || !Array.isArray(content)) {
    return [{ type: 'text', text: { content: '' } }];
  }

  return content.map(element => {
    const richTextElement = {
      type: 'text',
      text: {
        content: element.content || ''
      }
    };

    // Handle links
    if (element.href) {
      richTextElement.text.link = { url: element.href };
    }

    // Handle annotations
    const annotations = {};
    if (element.type === 'bold') annotations.bold = true;
    if (element.type === 'italic') annotations.italic = true;
    if (element.type === 'code') annotations.code = true;
    if (element.type === 'strikethrough') annotations.strikethrough = true;
    if (element.type === 'underline') annotations.underline = true;

    // Handle color from attributes
    if (element.attributes && element.attributes.style) {
      const color = convertColor(element.attributes.style);
      if (color !== 'default') {
        annotations.color = color;
      }
    }

    if (Object.keys(annotations).length > 0) {
      richTextElement.annotations = annotations;
    }

    richTextElement.plain_text = element.content || '';

    return richTextElement;
  });
}

/**
 * Create a heading block
 */
function createHeading(heading) {
  const level = Math.min(Math.max(heading.level || 1, 1), 3);
  const headingType = `heading_${level}`;
  
  const block = {
    object: 'block',
    type: headingType
  };

  block[headingType] = {
    rich_text: [{
      type: 'text',
      text: { content: heading.text || '' },
      plain_text: heading.text || ''
    }],
    color: 'default'
  };

  return block;
}

/**
 * Create a paragraph block
 */
function createParagraph(content, attributes = null) {
  const richText = convertRichText(content);
  
  const block = {
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: richText,
      color: attributes && attributes.style ? convertColor(attributes.style) : 'default'
    }
  };

  return block;
}

/**
 * Create a bulleted list item block
 */
function createBulletedListItem(content, children = null) {
  const richText = convertRichText(content);
  
  const block = {
    object: 'block',
    type: 'bulleted_list_item',
    bulleted_list_item: {
      rich_text: richText,
      color: 'default'
    }
  };

  if (children && children.length > 0) {
    block.bulleted_list_item.children = children.map(child => 
      createBulletedListItem(child.content, child.children)
    );
  }

  return block;
}

/**
 * Create a numbered list item block
 */
function createNumberedListItem(content, children = null) {
  const richText = convertRichText(content);
  
  const block = {
    object: 'block',
    type: 'numbered_list_item',
    numbered_list_item: {
      rich_text: richText,
      color: 'default'
    }
  };

  if (children && children.length > 0) {
    block.numbered_list_item.children = children.map(child => 
      createNumberedListItem(child.content, child.children)
    );
  }

  return block;
}

/**
 * Create an image block
 */
function createImage(figureContent) {
  const block = {
    object: 'block',
    type: 'image'
  };

  if (figureContent.src) {
    block.image = {
      type: 'external',
      external: {
        url: figureContent.src
      }
    };

    // Add caption if available
    if (figureContent.caption) {
      block.image.caption = convertRichText(figureContent.caption);
    } else if (figureContent.alt) {
      block.image.caption = [{
        type: 'text',
        text: { content: figureContent.alt },
        plain_text: figureContent.alt
      }];
    }
  } else if (figureContent.placeholder) {
    // Create a paragraph with placeholder text for missing images
    return createParagraph([{
      type: 'text',
      content: figureContent.placeholder,
      attributes: { style: 'color: orange;' }
    }]);
  }

  return block;
}

/**
 * Create a callout block
 */
function createCallout(content, type = 'info') {
  const iconMap = {
    'info': '💡',
    'warning': '⚠️',
    'error': '❌',
    'success': '✅',
    'note': '📝',
    'tip': '💡'
  };

  const block = {
    object: 'block',
    type: 'callout',
    callout: {
      rich_text: convertRichText(content),
      icon: {
        type: 'emoji',
        emoji: iconMap[type] || '💡'
      },
      color: 'default'
    }
  };

  return block;
}

/**
 * Create a code block
 */
function createCodeBlock(codeContent) {
  const block = {
    object: 'block',
    type: 'code',
    code: {
      rich_text: [{
        type: 'text',
        text: { content: codeContent.code || '' },
        plain_text: codeContent.code || ''
      }],
      language: codeContent.language || 'plain_text'
    }
  };

  if (codeContent.caption) {
    block.code.caption = convertRichText([{ content: codeContent.caption }]);
  }

  return block;
}

/**
 * Create a divider block
 */
function createDivider() {
  return {
    object: 'block',
    type: 'divider',
    divider: {}
  };
}

/**
 * Process content blocks and convert to Notion blocks
 */
function processContentBlocks(contentBlocks) {
  const notionBlocks = [];

  if (!contentBlocks || !Array.isArray(contentBlocks)) {
    return notionBlocks;
  }

  contentBlocks.forEach(block => {
    try {
      switch (block.type) {
        case 'paragraph':
          notionBlocks.push(createParagraph(block.content, block.attributes));
          break;

        case 'plain_text':
          notionBlocks.push(createParagraph([{
            type: 'text',
            content: block.content || ''
          }]));
          break;

        case 'heading':
          if (block.content && Array.isArray(block.content) && block.content.length > 0) {
            const headingText = block.content.map(c => c.content).join(' ');
            notionBlocks.push(createHeading({
              level: 4,
              text: headingText
            }));
          }
          break;

        case 'bullet_list':
          if (block.content && block.content.items) {
            block.content.items.forEach(item => {
              notionBlocks.push(createBulletedListItem(item.content, item.children));
            });
          }
          break;

        case 'numbered_list':
          if (block.content && block.content.items) {
            block.content.items.forEach(item => {
              notionBlocks.push(createNumberedListItem(item.content, item.children));
            });
          }
          break;

        case 'figure':
          if (block.content) {
            notionBlocks.push(createImage(block.content));
          }
          break;

        case 'callout':
          if (block.content) {
            notionBlocks.push(createCallout(block.content.content, block.content.type));
          }
          break;

        case 'code_block':
          if (block.content) {
            notionBlocks.push(createCodeBlock(block.content));
          }
          break;

        case 'divider':
          notionBlocks.push(createDivider());
          break;

        default:
          console.log(`Unknown block type: ${block.type}, treating as paragraph`);
          if (block.content) {
            notionBlocks.push(createParagraph(Array.isArray(block.content) ? block.content : [{
              type: 'text',
              content: String(block.content)
            }]));
          }
      }
    } catch (error) {
      console.error(`Error processing block type ${block.type}:`, error.message);
      // Add a fallback paragraph with error info
      notionBlocks.push(createParagraph([{
        type: 'text',
        content: `[Error processing ${block.type} block]`,
        attributes: { style: 'color: red;' }
      }]));
    }
  });

  return notionBlocks;
}

/**
 * Process sections recursively
 */
function processSections(sections) {
  const notionBlocks = [];

  if (!sections || !Array.isArray(sections)) {
    return notionBlocks;
  }

  sections.forEach(section => {
    try {
      // Add section heading if present
      if (section.heading) {
        notionBlocks.push(createHeading(section.heading));
      }

      // Process section content
      if (section.content) {
        const contentBlocks = processContentBlocks(section.content);
        notionBlocks.push(...contentBlocks);
      }

      // Process subsections recursively
      if (section.subsections) {
        const subsectionBlocks = processSections(section.subsections);
        notionBlocks.push(...subsectionBlocks);
      }

      // Add spacing between major sections
      if (section.heading && section.heading.level <= 3) {
        notionBlocks.push(createDivider());
      }
    } catch (error) {
      console.error(`Error processing section ${section.id}:`, error.message);
      notionBlocks.push(createParagraph([{
        type: 'text',
        content: `[Error processing section: ${section.id || 'unknown'}]`,
        attributes: { style: 'color: red;' }
      }]));
    }
  });

  return notionBlocks;
}

/**
 * Create document header with metadata
 */
function createDocumentHeader(metadata) {
  const headerBlocks = [];

  if (metadata && metadata.title) {
    headerBlocks.push(createHeading({
      level: 1,
      text: metadata.title
    }));
  }

  // Add metadata info as a callout
  if (metadata) {
    const metadataContent = [];
    
    if (metadata.version) {
      metadataContent.push({ type: 'text', content: `Version: ${metadata.version}` });
    }
    if (metadata.lastUpdated) {
      const date = new Date(metadata.lastUpdated).toLocaleDateString();
      metadataContent.push({ type: 'text', content: `\nLast Updated: ${date}` });
    }
    if (metadata.tags && metadata.tags.length > 0) {
      metadataContent.push({ type: 'text', content: `\nTags: ${metadata.tags.join(', ')}` });
    }

    if (metadataContent.length > 0) {
      headerBlocks.push(createCallout(metadataContent, 'info'));
    }
  }

  return headerBlocks;
}

/**
 * Create table of contents
 */
function createTableOfContents(sections) {
  if (!sections || !Array.isArray(sections)) {
    return [];
  }

  const tocBlocks = [];
  
  // Add TOC heading
  tocBlocks.push(createHeading({
    level: 2,
    text: 'Table of Contents'
  }));

  // Create TOC items
  sections.forEach(section => {
    if (section.heading) {
      const indent = '  '.repeat(Math.max(0, (section.heading.level || 1) - 1));
      const tocItem = `${indent}• ${section.heading.text}`;
      
      tocBlocks.push(createParagraph([{
        type: 'text',
        content: tocItem
      }]));
    }
  });

  tocBlocks.push(createDivider());
  
  return tocBlocks;
}

// Main processing
try {
  console.log('Starting document conversion...');
  
  const notionBlocks = [];
  
  // 1. Create document header with metadata
  if (document.metadata) {
    console.log('Processing document metadata...');
    const headerBlocks = createDocumentHeader(document.metadata);
    notionBlocks.push(...headerBlocks);
  }

  // 2. Create table of contents (optional)
  if (document.sections && document.sections.length > 3) {
    console.log('Generating table of contents...');
    const tocBlocks = createTableOfContents(document.sections);
    notionBlocks.push(...tocBlocks);
  }

  // 3. Process all sections
  if (document.sections) {
    console.log(`Processing ${document.sections.length} sections...`);
    const sectionBlocks = processSections(document.sections);
    notionBlocks.push(...sectionBlocks);
  }

  // 4. Add navigation footer if present
  if (document.navigation) {
    console.log('Adding navigation footer...');
    notionBlocks.push(createDivider());
    
    const navItems = [];
    if (document.navigation.previousPage) {
      navItems.push(`← Previous: ${document.navigation.previousPage.text}`);
    }
    if (document.navigation.nextPage) {
      navItems.push(`Next: ${document.navigation.nextPage.text} →`);
    }

    if (navItems.length > 0) {
      notionBlocks.push(createParagraph([{
        type: 'text',
        content: navItems.join(' | ')
      }]));
    }
  }

  // Prepare final output
  const output = {
    success: true,
    children: notionBlocks,
    summary: {
      totalBlocks: notionBlocks.length,
      documentTitle: document.metadata?.title || 'Untitled Document',
      sectionsProcessed: document.sections?.length || 0,
      hasMetadata: !!document.metadata,
      hasNavigation: !!document.navigation,
      processingTimestamp: new Date().toISOString()
    }
  };

  console.log(`Conversion complete! Generated ${notionBlocks.length} Notion blocks.`);
  console.log(`Document: ${output.summary.documentTitle}`);
  console.log(`Sections: ${output.summary.sectionsProcessed}`);

  return [{ json: output }];

} catch (error) {
  console.error('Error during conversion:', error.message);
  
  return [{
    json: {
      success: false,
      error: error.message,
      stack: error.stack,
      inputPreview: JSON.stringify(inputData).substring(0, 500) + '...'
    }
  }];
}