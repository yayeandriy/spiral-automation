// n8n JavaScript Code Node: Convert Notion Blocks to HTML Tables
// This script converts Notion blocks JSON structure to HTML tables for landing pages

// Get input data (Notion blocks array)
const blocks = $input.all().map( b => b.json);
// n8n JavaScript Code Node: Convert Notion Blocks to HTML Tables
// This script converts Notion blocks JSON structure to HTML tables for landing pages


// Utility functions
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function extractRichText(richTextArray) {
  if (!richTextArray || !Array.isArray(richTextArray)) return '';
  
  return richTextArray.map(item => {
    if (!item || !item.text) return '';
    
    let content = escapeHtml(item.text.content || '');
    const annotations = item.annotations || {};
    
    // Apply formatting
    if (annotations.bold) content = `<strong>${content}</strong>`;
    if (annotations.italic) content = `<em>${content}</em>`;
    if (annotations.underline) content = `<u>${content}</u>`;
    if (annotations.strikethrough) content = `<s>${content}</s>`;
    if (annotations.code) content = `<code>${content}</code>`;
    
    // Apply color styling
    if (annotations.color && annotations.color !== 'default') {
      const colorMap = {
        'gray': 'color: gray',
        'brown': 'color: #8B4513',
        'orange': 'color: #FF8C00',
        'yellow': 'color: #DAA520',
        'green': 'color: #228B22',
        'blue': 'color: #0000CD',
        'purple': 'color: #800080',
        'pink': 'color: #FF69B4',
        'red': 'color: #DC143C',
        'gray_background': 'background-color: #f1f1f1',
        'brown_background': 'background-color: #f4f1e8',
        'orange_background': 'background-color: #fff4e6',
        'yellow_background': 'background-color: #fffbf0',
        'green_background': 'background-color: #f0f9f0',
        'blue_background': 'background-color: #f0f8ff',
        'purple_background': 'background-color: #f8f0ff',
        'pink_background': 'background-color: #fff0f8',
        'red_background': 'background-color: #fff0f0',
        'default_background': 'background-color: #f8f9fa'
      };
      
      const colorStyle = colorMap[annotations.color];
      if (colorStyle) {
        content = `<span style="${colorStyle}">${content}</span>`;
      }
    }
    
    // Apply link
    if (item.text.link && item.text.link.url) {
      content = `<a href="${escapeHtml(item.text.link.url)}">${content}</a>`;
    }
    
    return content;
  }).join('');
}

function renderBlock(block, level = 0) {
  if (!block || !block.type) return '';
  
  const blockType = block.type;
  let html = '';
  
  switch (blockType) {
    case 'heading_1':
      const h1Text = extractRichText(block.heading_1?.rich_text || block.heading_1?.text);
      html = `<h1>${h1Text}</h1>`;
      break;
      
    case 'heading_2':
      const h2Text = extractRichText(block.heading_2?.rich_text || block.heading_2?.text);
      html = `<h2>${h2Text}</h2>`;
      break;
      
    case 'heading_3':
      const h3Text = extractRichText(block.heading_3?.rich_text || block.heading_3?.text);
      html = `<h3>${h3Text}</h3>`;
      break;
      
    case 'paragraph':
      const pText = extractRichText(block.paragraph?.rich_text || block.paragraph?.text);
      if (pText.trim()) {
        html = `<p>${pText}</p>`;
      }
      break;
      
    case 'bulleted_list_item':
      const bulletText = extractRichText(block.bulleted_list_item?.rich_text || block.bulleted_list_item?.text);
      html = bulletText; // Direct content without symbols or line breaks
      break;
      
    case 'numbered_list_item':
      const numberedText = extractRichText(block.numbered_list_item?.rich_text || block.numbered_list_item?.text);
      html = numberedText; // Direct content without numbers or line breaks
      break;
      
    case 'callout':
      const calloutData = block.callout;
      const calloutText = extractRichText(calloutData?.rich_text || calloutData?.text);
      const icon = calloutData?.icon?.emoji || '';
      let calloutHtml = `${icon ? icon + ' ' : ''}${calloutText}`; // No <p> wrapper
      
      // Apply callout background color as inline style
      if (calloutData?.color) {
        const colorMap = {
          'gray_background': 'background-color: #f1f1f1; padding: 8px; border-left: 3px solid #ccc; display: block;',
          'brown_background': 'background-color: #f4f1e8; padding: 8px; border-left: 3px solid #8B4513; display: block;',
          'orange_background': 'background-color: #fff4e6; padding: 8px; border-left: 3px solid #FF8C00; display: block;',
          'yellow_background': 'background-color: #fffbf0; padding: 8px; border-left: 3px solid #DAA520; display: block;',
          'green_background': 'background-color: #f0f9f0; padding: 8px; border-left: 3px solid #228B22; display: block;',
          'blue_background': 'background-color: #f0f8ff; padding: 8px; border-left: 3px solid #0000CD; display: block;',
          'purple_background': 'background-color: #f8f0ff; padding: 8px; border-left: 3px solid #800080; display: block;',
          'pink_background': 'background-color: #fff0f8; padding: 8px; border-left: 3px solid #FF69B4; display: block;',
          'red_background': 'background-color: #fff0f0; padding: 8px; border-left: 3px solid #DC143C; display: block;'
        };
        
        const style = colorMap[calloutData.color] || 'padding: 8px; border-left: 3px solid #ddd; display: block;';
        calloutHtml = `<span style="${style}">${calloutHtml}</span>`;
      }
      html = calloutHtml;
      break;
      
    case 'image':
      const imageData = block.image;
      let imageUrl = '';
      
      if (imageData?.external?.url) {
        imageUrl = imageData.external.url;
      } else if (imageData?.file?.url) {
        imageUrl = imageData.file.url;
      }
      
      if (imageUrl) {
        const caption = extractRichText(imageData?.caption);
        html = `<img src="${escapeHtml(imageUrl)}" alt="${caption || 'Image'}" style="max-width: 100%; height: auto">`;
        if (caption) {
          html += `<br><em>${caption}</em>`; // Use <br> instead of <p>
        }
      }
      break;
      
    case 'divider':
      html = '<hr style="margin: 10px 0;">';
      break;
      
    case 'code':
      const codeData = block.code;
      const codeText = extractRichText(codeData?.rich_text || codeData?.text);
      const language = codeData?.language || '';
      html = `<code class="language-${language}" style="display: block; padding: 8px; background-color: #f5f5f5; border-radius: 3px;">${codeText}</code>`;
      break;
      
    case 'quote':
      const quoteText = extractRichText(block.quote?.rich_text || block.quote?.text);
      html = `<em style="border-left: 3px solid #ddd; padding-left: 10px; display: block;">${quoteText}</em>`;
      break;
  }
  
  return html;
}

function processColumnList(allBlocks, startIndex) {
  const columnListBlock = allBlocks[startIndex];
  const columnListId = columnListBlock.id;
  
  // Find all direct column children of this column_list
  const columns = [];
  let maxIndex = startIndex;
  
  // Collect all column blocks that are direct children of this column_list
  for (let i = startIndex + 1; i < allBlocks.length; i++) {
    const block = allBlocks[i];
    if (block.type === 'column' && block.parent_id === columnListId) {
      columns.push(block);
      maxIndex = i;
    } else if (block.type === 'column_list') {
      // Stop if we hit another column_list
      break;
    }
  }
  
  if (columns.length === 0) return { html: '', nextIndex: startIndex + 1 };
  
  // Calculate column widths (equal distribution)
  const columnWidth = Math.floor(100 / columns.length);
  
  // Generate colgroup
  let colgroup = '<colgroup>';
  columns.forEach((_, index) => {
    const width = index === columns.length - 1 ? 
      (100 - (columnWidth * (columns.length - 1))) : columnWidth;
    colgroup += `<col style="width: ${width}%;">`;
  });
  colgroup += '</colgroup>';
  
  // Generate table row with all columns
  let tableRow = '<tr>';
  
  for (const column of columns) {
    const columnId = column.id;
    
    // Find all blocks that belong to this specific column
    const columnBlocks = allBlocks.filter(block => 
      block.parent_id === columnId && block.type !== 'column'
    );
    
    let cellContent = '';
    for (const block of columnBlocks) {
      const blockHtml = renderBlock(block);
      if (blockHtml.trim()) {
        cellContent += blockHtml;
      }
    }
    
    // If cell is empty, add non-breaking space to maintain table structure
    if (!cellContent.trim()) {
      cellContent = '&nbsp;';
    }
    
    tableRow += `<td>${cellContent}</td>`;
  }
  
  tableRow += '</tr>';
  
  const tableHtml = `<table>${colgroup}${tableRow}</table>`;
  
  // Return next index after all processed blocks (column_list + all its columns + all column content)
  let nextIndex = maxIndex + 1;
  
  // Skip any blocks that were children of the columns we just processed
  while (nextIndex < allBlocks.length) {
    const nextBlock = allBlocks[nextIndex];
    const isColumnChild = columns.some(col => nextBlock.parent_id === col.id);
    if (isColumnChild) {
      nextIndex++;
    } else {
      break;
    }
  }
  
  return { html: tableHtml, nextIndex: nextIndex };
}

// Main processing function
function convertBlocksToHtml(blocksData) {
  if (!blocksData || !Array.isArray(blocksData)) {
    return '<table><colgroup><col style="width: 100%;"></colgroup><tr><td>No valid blocks data provided</td></tr></table>';
  }
  
  let html = '';
  let i = 0;
  const processedBlockIds = new Set(); // Track processed blocks to avoid duplication
  
  while (i < blocksData.length) {
    const block = blocksData[i];
    
    if (!block || !block.type || processedBlockIds.has(block.id)) {
      i++;
      continue;
    }
    
    if (block.type === 'column_list') {
      // Process column_list and all its columns in one table
      const result = processColumnList(blocksData, i);
      html += result.html;
      
      // Mark all processed blocks as handled
      const columnListId = block.id;
      processedBlockIds.add(columnListId);
      
      // Mark all columns and their children as processed
      for (let j = i + 1; j < result.nextIndex; j++) {
        const processedBlock = blocksData[j];
        if (processedBlock && processedBlock.id) {
          processedBlockIds.add(processedBlock.id);
        }
      }
      
      i = result.nextIndex;
    } else if (block.type === 'column') {
      // Skip standalone columns (they should be processed by column_list)
      processedBlockIds.add(block.id);
      i++;
    } else {
      // Check if this block is a child of a column (already processed)
      const isColumnChild = blocksData.some(otherBlock => 
        otherBlock.type === 'column' && 
        block.parent_id === otherBlock.id
      );
      
      if (!isColumnChild) {
        // Process regular blocks - wrap in single-column table
        const blockContent = renderBlock(block);
        if (blockContent.trim()) {
          html += `<table><colgroup><col style="width: 100%;"></colgroup><tr><td>${blockContent}</td></tr></table>`;
        }
      }
      
      processedBlockIds.add(block.id);
      i++;
    }
  }
  
  return html;
}

// Process the input
let htmlOutput = '';

try {
  // Handle different input structures
  if (blocks.length === 1 && blocks[0].json) {
    // Input is wrapped in json property
    const blocksArray = blocks[0].json.children || blocks[0].json;
    htmlOutput = convertBlocksToHtml(blocksArray);
  } else if (blocks.length === 1 && Array.isArray(blocks[0])) {
    // Input is direct array
    htmlOutput = convertBlocksToHtml(blocks[0]);
  } else if (Array.isArray(blocks) && blocks.length > 0 && blocks[0].type) {
    // Input is array of blocks
    htmlOutput = convertBlocksToHtml(blocks);
  } else {
    // Try to extract from children property
    const allBlocks = blocks.flatMap(item => {
      if (item.json && item.json.children) return item.json.children;
      if (item.children) return item.children;
      if (Array.isArray(item)) return item;
      return [item];
    }).filter(block => block && block.type);
    
    htmlOutput = convertBlocksToHtml(allBlocks);
  }
  
  if (!htmlOutput.trim()) {
    htmlOutput = '<table><colgroup><col style="width: 100%;"></colgroup><tr><td>No content generated from blocks</td></tr></table>';
  }
  
} catch (error) {
  htmlOutput = `<table><colgroup><col style="width: 100%;"></colgroup><tr><td>Error processing blocks: ${error.message}</td></tr></table>`;
  console.error('Conversion error:', error);
  console.log('Input structure:', JSON.stringify(blocks, null, 2));
}

// Return the converted HTML
return [{
  json: {
    html: htmlOutput,
    block_count: blocks.length,
    conversion_timestamp: new Date().toISOString()
  }
}];