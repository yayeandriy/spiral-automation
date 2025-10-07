// n8n JavaScript Code Node: Convert Notion Blocks to HTML Tables with Metadata Header
// This script converts Notion blocks JSON structure to HTML tables for landing pages
// and renders metadata as a header section

// Get input data (Notion blocks array with metadata)
const inputData = $input.all().map(b => b.json);

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

// Format date for display
function formatDate(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch (e) {
    return dateString;
  }
}

// Generate metadata header HTML
function generateMetadataHeader(metadata) {
  if (!metadata) return '';
  
  let headerHtml = '<header class="page-header">';
  
  // Title/Name
  if (metadata.property_name || metadata.name) {
    const title = metadata.property_name || metadata.name;
    headerHtml += `<a class="button button-main" href="/static/explorations">Explorations</a>`;
    headerHtml += `<h1>${escapeHtml(title)}</h1>`;
  }
  
  // Metadata properties section
  const metaItems = [];
  
  // Timeline (date range)
  if (metadata.property_timeline) {
    const timeline = metadata.property_timeline;
    if (timeline.start) {
      const startDate = formatDate(timeline.start);
      const endDate = timeline.end ? formatDate(timeline.end) : 'Present';
      metaItems.push(`<div class="meta-item"> ${escapeHtml(startDate)} → ${escapeHtml(endDate)}</div>`);
    }
  }
  
  // Areas (tags/categories)
  if (metadata.property_areas && Array.isArray(metadata.property_areas) && metadata.property_areas.length > 0) {
    const areasList = metadata.property_areas.map(area => 
      `<span class="tag">${escapeHtml(area)}</span>`
    ).join('');
    metaItems.push(`<div class="meta-item"> ${areasList}</div>`);
  }
  
  // Render metadata items
  if (metaItems.length > 0) {
    headerHtml += '<div class="page-metadata">';
    headerHtml += metaItems.join('');
    headerHtml += '</div>';
  }
  
  headerHtml += '</header>';
  
  return headerHtml;
}

// Process button syntax: BUTTON: (type,title,href) -> button HTML with script
function processButtons(text) {
  if (!text) return text;
  
  // Pattern: BUTTON: (button_type,button_title,button_href)
  const buttonPattern = /BUTTON:\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/g;
  
  return text.replace(buttonPattern, (match, buttonType, buttonTitle, buttonHref) => {
    // Clean up the extracted values
    const cleanType = buttonType.trim();
    const cleanTitle = buttonTitle.trim();
    const cleanHref = buttonHref.trim();
    
    // Generate ID from title (lowercase, replace spaces and special chars with hyphens)
    const buttonId = cleanTitle.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    
    // Generate button HTML with script
    // const buttonHtml = `<button class="button button-${escapeHtml(cleanType)}" id="${buttonId}">${escapeHtml(cleanTitle)}</button>`;
    const buttonHtml = `<a class="button button-${escapeHtml(cleanType)}" id="${buttonId}" href="${escapeHtml(cleanHref)}">${escapeHtml(cleanTitle)}</a>`;
    const scriptHtml = `<script>
  document.getElementById('${buttonId}').addEventListener('click', () => {
    window.location.href = '${escapeHtml(cleanHref)}';
  });
</script>`;
    
    return buttonHtml + scriptHtml;
  });
}

function extractRichText(richTextArray) {
  if (!richTextArray || !Array.isArray(richTextArray)) return '';
  
  let result = richTextArray.map(item => {
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
  
  // Process button syntax in the final result
  return processButtons(result);
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
      html = `<ul><li>${bulletText}</li></ul>`;
      break;
      
    case 'numbered_list_item':
      const numberedText = extractRichText(block.numbered_list_item?.rich_text || block.numbered_list_item?.text);
      html = `<ol><li>${numberedText}</li></ol>`;
      break;
      
    case 'callout':
      const calloutData = block.callout;
      const calloutText = extractRichText(calloutData?.rich_text || calloutData?.text);
      const icon = calloutData?.icon?.emoji || '';
      let calloutContent = `${icon ? icon + ' ' : ''}${calloutText}`;
      
      // Convert callout to div with class static-callout
      html = `<div class="static-callout">${calloutContent}</div>`;
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
      
    case 'child_database':
      html = '<data-placeholder/>';
      break;
  }
  
  return html;
}

function processCallout(allBlocks, startIndex) {
  const calloutBlock = allBlocks[startIndex];
  const calloutId = calloutBlock.id;
  const calloutData = calloutBlock.callout;
  
  // Get the direct text content of the callout
  const calloutText = extractRichText(calloutData?.rich_text || calloutData?.text);
  const icon = calloutData?.icon?.emoji || '';
  
  // Build callout content
  let calloutContent = '';
  
  // Add icon and direct text if any
  if (icon || calloutText) {
    calloutContent += `${icon ? icon + ' ' : ''}${calloutText}`;
  }
  
  // Process all content within this callout recursively
  calloutContent += processNestedBlocks(allBlocks, calloutId);
  
  // Find the next index after all descendants of this callout
  let nextIndex = startIndex + 1;
  while (nextIndex < allBlocks.length) {
    const block = allBlocks[nextIndex];
    const isCalloutDescendant = isDescendantOfCallout(allBlocks, block, calloutId);
    if (!isCalloutDescendant) {
      break;
    }
    nextIndex++;
  }
  
  // Generate callout HTML
  const calloutHtml = `<div class="static-callout">${calloutContent}</div>`;
  
  return { html: calloutHtml, nextIndex: nextIndex };
}

// Process all nested blocks within a parent container
function processNestedBlocks(allBlocks, parentId) {
  let content = '';
  
  // Find all direct children of the parent
  const directChildren = allBlocks.filter(block => block.parent_id === parentId);
  
  // Sort children by their position in the original array to maintain order
  directChildren.sort((a, b) => {
    const indexA = allBlocks.indexOf(a);
    const indexB = allBlocks.indexOf(b);
    return indexA - indexB;
  });
  
  for (const childBlock of directChildren) {
    if (childBlock.type === 'column_list') {
      // Process column_list structure
      const columnListId = childBlock.id;
      const columns = allBlocks.filter(block => 
        block.type === 'column' && block.parent_id === columnListId
      );
      
      if (columns.length > 0) {
        // Extract width ratios (these are relative weights, not percentages)
        const widthRatios = columns.map(column => {
          const widthRatio = column.column?.width_ratio;
          return (widthRatio && typeof widthRatio === 'number' && widthRatio > 0) ? widthRatio : 1;
        });
        
        // Calculate total of all ratios
        const totalRatio = widthRatios.reduce((sum, ratio) => sum + ratio, 0);
        
        // Convert ratios to percentages
        const columnWidths = widthRatios.map(ratio => {
          return Math.max(1, Math.round((ratio / totalRatio) * 100 * 100) / 100);
        });
        
        // Ensure total is exactly 100% by adjusting last column
        const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0);
        if (totalWidth !== 100 && columnWidths.length > 0) {
          columnWidths[columnWidths.length - 1] += (100 - totalWidth);
          columnWidths[columnWidths.length - 1] = Math.max(1, columnWidths[columnWidths.length - 1]);
        }
        
        // Generate colgroup with calculated widths
        let colgroup = '<colgroup>';
        columnWidths.forEach(width => {
          colgroup += `<col style="width: ${width}%;">`;
        });
        colgroup += '</colgroup>';
        
        // Generate table row
        let tableRow = '<tr>';
        for (const column of columns) {
          let cellContent = processNestedBlocks(allBlocks, column.id);
          if (!cellContent.trim()) {
            cellContent = '&nbsp;';
          }
          tableRow += `<td>${cellContent}</td>`;
        }
        tableRow += '</tr>';
        
        content += `<table>${colgroup}${tableRow}</table>`;
      }
    } else if (childBlock.type === 'callout') {
      // Process nested callout
      const nestedCalloutData = childBlock.callout;
      const nestedCalloutText = extractRichText(nestedCalloutData?.rich_text || nestedCalloutData?.text);
      const nestedIcon = nestedCalloutData?.icon?.emoji || '';
      
      let nestedCalloutContent = '';
      if (nestedIcon || nestedCalloutText) {
        nestedCalloutContent += `${nestedIcon ? nestedIcon + ' ' : ''}${nestedCalloutText}`;
      }
      
      nestedCalloutContent += processNestedBlocks(allBlocks, childBlock.id);
      content += `<div class="static-callout">${nestedCalloutContent}</div>`;
    } else {
      // Regular block - render it normally
      const blockHtml = renderBlock(childBlock);
      if (blockHtml.trim()) {
        content += blockHtml;
      }
      
      // Check if this block has children that need to be processed
      if (childBlock.has_children && childBlock.type !== 'column_list' && childBlock.type !== 'callout') {
        const nestedContent = processNestedBlocks(allBlocks, childBlock.id);
        if (nestedContent.trim()) {
          content += nestedContent;
        }
      }
    }
  }
  
  return content;
}

// Helper function to check if a block is a descendant of a callout
function isDescendantOfCallout(allBlocks, block, calloutId) {
  let currentParentId = block.parent_id;
  
  while (currentParentId) {
    if (currentParentId === calloutId) {
      return true;
    }
    
    // Find the parent block
    const parentBlock = allBlocks.find(b => b.id === currentParentId);
    if (!parentBlock) {
      break;
    }
    
    currentParentId = parentBlock.parent_id;
  }
  
  return false;
}

// Helper function to get all descendant IDs of a block
function getDescendantIds(allBlocks, parentId) {
  const descendants = new Set();
  
  function addDescendants(currentParentId) {
    const children = allBlocks.filter(block => block.parent_id === currentParentId);
    for (const child of children) {
      descendants.add(child.id);
      addDescendants(child.id); // Recursively add grandchildren
    }
  }
  
  addDescendants(parentId);
  return descendants;
}

// Helper function to check if a block is a descendant of another block
function isDescendantOf(allBlocks, block, ancestorId) {
  let currentParentId = block.parent_id;
  
  while (currentParentId) {
    if (currentParentId === ancestorId) {
      return true;
    }
    
    // Find the parent block
    const parentBlock = allBlocks.find(b => b.id === currentParentId);
    if (!parentBlock) {
      break;
    }
    
    currentParentId = parentBlock.parent_id;
  }
  
  return false;
}

function processColumnList(allBlocks, startIndex) {
  const columnListBlock = allBlocks[startIndex];
  const columnListId = columnListBlock.id;
  
  // Find all direct column children of this column_list
  const columns = allBlocks.filter(block => 
    block.type === 'column' && block.parent_id === columnListId
  );
  
  if (columns.length === 0) return { html: '', nextIndex: startIndex + 1 };
  
  // Sort columns by their position in the original array
  columns.sort((a, b) => {
    const indexA = allBlocks.indexOf(a);
    const indexB = allBlocks.indexOf(b);
    return indexA - indexB;
  });
  
  // Extract width ratios (these are relative weights, not percentages)
  const widthRatios = columns.map(column => {
    const widthRatio = column.column?.width_ratio;
    return (widthRatio && typeof widthRatio === 'number' && widthRatio > 0) ? widthRatio : 1;
  });
  
  // Calculate total of all ratios
  const totalRatio = widthRatios.reduce((sum, ratio) => sum + ratio, 0);
  
  // Convert ratios to percentages
  const columnWidths = widthRatios.map(ratio => {
    return Math.max(1, Math.round((ratio / totalRatio) * 100 * 100) / 100);
  });
  
  // Ensure total is exactly 100% by adjusting last column
  const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0);
  if (totalWidth !== 100 && columnWidths.length > 0) {
    columnWidths[columnWidths.length - 1] += (100 - totalWidth);
    columnWidths[columnWidths.length - 1] = Math.max(1, columnWidths[columnWidths.length - 1]);
  }
  
  // Generate colgroup with calculated widths
  let colgroup = '<colgroup>';
  columnWidths.forEach(width => {
    colgroup += `<col style="width: ${width}%;">`;
  });
  colgroup += '</colgroup>';
  
  // Generate table row with all columns
  let tableRow = '<tr>';
  
  for (const column of columns) {
    const cellContent = processNestedBlocks(allBlocks, column.id);
    tableRow += `<td>${cellContent || '&nbsp;'}</td>`;
  }
  
  tableRow += '</tr>';
  
  const tableHtml = `<table>${colgroup}${tableRow}</table>`;
  
  // Find next index after all descendants of this column_list
  let nextIndex = startIndex + 1;
  while (nextIndex < allBlocks.length) {
    const block = allBlocks[nextIndex];
    const isDescendant = isDescendantOf(allBlocks, block, columnListId);
    if (!isDescendant) {
      break;
    }
    nextIndex++;
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
    } else if (block.type === 'callout') {
      // Process callout and its children specially
      const result = processCallout(blocksData, i);
      html += result.html;
      
      // Mark all processed blocks as handled
      processedBlockIds.add(block.id);
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
      // Check if this block is a child of a column or callout (already processed)
      const isColumnChild = blocksData.some(otherBlock => 
        otherBlock.type === 'column' && 
        block.parent_id === otherBlock.id
      );
      
      const isCalloutChild = blocksData.some(otherBlock => 
        otherBlock.type === 'callout' && 
        block.parent_id === otherBlock.id
      );
      
      if (!isColumnChild && !isCalloutChild) {
        // Process regular blocks
        const blockContent = renderBlock(block);
        if (blockContent.trim()) {
          // Wrap blocks in single-column table (callouts are handled separately above)
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
let metadata = null;

try {
  // Extract metadata and content blocks
  let contentBlocks = [];
  
  // Check if input has meta_data and content structure
  if (inputData.length > 0) {
    const firstItem = inputData[0];
    
    if (firstItem.meta_data && firstItem.content) {
      // New structure: { meta_data: {...}, content: [...] }
      metadata = firstItem.meta_data;
      contentBlocks = firstItem.content.map(item => item.json || item);
    } else if (firstItem.json && firstItem.json.meta_data && firstItem.json.content) {
      // Wrapped structure
      metadata = firstItem.json.meta_data;
      contentBlocks = firstItem.json.content.map(item => item.json || item);
    } else if (firstItem.type) {
      // Direct array of blocks (old structure)
      contentBlocks = inputData;
    } else if (Array.isArray(firstItem)) {
      // Array within array
      contentBlocks = firstItem;
    }
  }
  
  // Generate metadata header if available
  if (metadata) {
    htmlOutput += generateMetadataHeader(metadata);
  }
  
  // Generate content HTML
  const contentHtml = convertBlocksToHtml(contentBlocks);
  htmlOutput += contentHtml;
  
  if (!htmlOutput.trim()) {
    htmlOutput = '<table><colgroup><col style="width: 100%;"></colgroup><tr><td>No content generated</td></tr></table>';
  }
  
} catch (error) {
  htmlOutput = `<table><colgroup><col style="width: 100%;"></colgroup><tr><td>Error processing: ${error.message}</td></tr></table>`;
  console.error('Conversion error:', error);
  console.log('Input structure:', JSON.stringify(inputData.slice(0, 2), null, 2));
}

// Return the converted HTML with metadata
return [{
  json: {
    html: htmlOutput,
    metadata: metadata,
    has_metadata: !!metadata,
    conversion_timestamp: new Date().toISOString()
  }
}];