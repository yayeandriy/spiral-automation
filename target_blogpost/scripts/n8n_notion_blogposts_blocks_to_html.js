// n8n script to convert Notion blocks into HTML (blog post layout)
// No HTML header, no scripts, no styles

// Helper: Escape HTML special characters
function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Helper: Process rich text array into HTML with formatting
function processRichText(richTextArray) {
  if (!Array.isArray(richTextArray)) return '';
  
  return richTextArray.map(item => {
    if (!item || !item.text || !item.text.content) return '';
    
    let content = escapeHtml(item.text.content);
    const annotations = item.annotations || {};
    
    // Apply formatting based on annotations
    if (annotations.bold) content = `<strong>${content}</strong>`;
    if (annotations.italic) content = `<em>${content}</em>`;
    if (annotations.code) content = `<code>${content}</code>`;
    if (annotations.strikethrough) content = `<s>${content}</s>`;
    if (annotations.underline) content = `<u>${content}</u>`;
    
    // Apply link if present
    const linkUrl = item.href || (item.text && item.text.link && item.text.link.url);
    if (linkUrl) {
      content = `<a href="${escapeHtml(linkUrl)}">${content}</a>`;
    }
    
    return content;
  }).join('');
}

// Helper: Convert a single Notion block to HTML
function blockToHtml(block) {
  if (!block || !block.type) return '';
  
  const type = block.type;
  const blockData = block[type];
  
  if (!blockData) return '';
  
  switch (type) {
    case 'heading_1':
      return `<h1>${processRichText(blockData.text)}</h1>`;
    
    case 'heading_2':
      return `<h2>${processRichText(blockData.text)}</h2>`;
    
    case 'heading_3':
      return `<h3>${processRichText(blockData.text)}</h3>`;
    
    case 'paragraph':
      const paragraphContent = processRichText(blockData.text);
      return paragraphContent ? `<p>${paragraphContent}</p>` : '';
    
    case 'bulleted_list_item':
      // Note: Lists need grouping (handled in main logic)
      return `<li>${processRichText(blockData.text)}</li>`;
    
    case 'numbered_list_item':
      // Note: Lists need grouping (handled in main logic)
      return `<li>${processRichText(blockData.text)}</li>`;
    
    case 'quote':
      return `<blockquote>${processRichText(blockData.text)}</blockquote>`;
    
    case 'code':
      const codeContent = blockData.text.map(t => t.plain_text || '').join('');
      const language = blockData.language || '';
      return `<pre><code${language ? ` data-language="${escapeHtml(language)}"` : ''}>${escapeHtml(codeContent)}</code></pre>`;
    
    case 'image':
      const imageUrl = blockData.external?.url || blockData.file?.url || '';
      const caption = blockData.caption ? processRichText(blockData.caption) : '';
      if (!imageUrl) return '';
      return `<figure>
  <img src="${escapeHtml(imageUrl)}" alt="${caption || ''}">${caption ? `
  <figcaption>${caption}</figcaption>` : ''}
</figure>`;
    
    case 'video':
      const videoUrl = blockData.external?.url || blockData.file?.url || '';
      if (!videoUrl) return '';
      return `<figure>
  <video controls src="${escapeHtml(videoUrl)}"></video>
</figure>`;
    
    case 'divider':
      return '<hr>';
    
    case 'callout':
      const calloutContent = processRichText(blockData.text);
      return calloutContent ? `<aside>${calloutContent}</aside>` : '';
    
    case 'toggle':
      const toggleContent = processRichText(blockData.text);
      return toggleContent ? `<details><summary>${toggleContent}</summary></details>` : '';
    
    default:
      // Unsupported block types are silently skipped
      return '';
  }
}

// Helper: Group consecutive list items
function groupListItems(blocks) {
  const result = [];
  let currentList = null;
  let currentListType = null;
  
  for (const block of blocks) {
    const type = block.type;
    
    if (type === 'bulleted_list_item' || type === 'numbered_list_item') {
      const listType = type === 'bulleted_list_item' ? 'ul' : 'ol';
      
      if (currentListType === listType) {
        // Continue current list
        currentList.items.push(block);
      } else {
        // Start new list
        if (currentList) {
          result.push(currentList);
        }
        currentList = { type: listType, items: [block] };
        currentListType = listType;
      }
    } else {
      // Non-list item, flush current list if any
      if (currentList) {
        result.push(currentList);
        currentList = null;
        currentListType = null;
      }
      result.push(block);
    }
  }
  
  // Flush remaining list
  if (currentList) {
    result.push(currentList);
  }
  
  return result;
}

// Main processing function
function convertNotionBlocksToHtml(blocks) {
  if (!Array.isArray(blocks)) {
    blocks = [blocks];
  }
  
  // Filter out archived or trashed blocks
  const validBlocks = blocks.filter(b => b && !b.archived && !b.in_trash);
  
  // Group list items
  const grouped = groupListItems(validBlocks);
  
  // Convert to HTML
  const htmlParts = [];
  
  for (const item of grouped) {
    if (item.type === 'ul' || item.type === 'ol') {
      // Process list
      const listItems = item.items.map(block => blockToHtml(block)).filter(html => html);
      if (listItems.length > 0) {
        htmlParts.push(`<${item.type}>\n  ${listItems.join('\n  ')}\n</${item.type}>`);
      }
    } else {
      // Process regular block
      const html = blockToHtml(item);
      if (html) {
        htmlParts.push(html);
      }
    }
  }
  
  return htmlParts.join('\n');
}

// Helper: Extract title from Notion properties
function extractTitle(properties) {
  if (!properties) return null;
  
  // Look for title property (usually "Name" or "title")
  for (const key in properties) {
    const prop = properties[key];
    if (prop.type === 'title' && prop.title && Array.isArray(prop.title)) {
      return prop.title.map(t => t.plain_text || '').join('');
    }
  }
  return null;
}

// Helper: Extract date from Notion properties
function extractDate(properties) {
  if (!properties) return null;
  
  // Look for date properties (publish_date, PublishDate, date, etc.)
  const dateKeys = ['publish_date', 'PublishDate', 'date', 'Date', 'published', 'Published'];
  for (const key of dateKeys) {
    if (properties[key] && properties[key].type === 'date' && properties[key].date) {
      return properties[key].date.start;
    }
  }
  return null;
}

// Helper: Extract authors from Notion properties
function extractAuthors(properties) {
  if (!properties) return [];
  
  // Look for people properties (author, Author, authors, Authors, etc.)
  const authorKeys = ['author', 'Author', 'authors', 'Authors', 'by', 'By'];
  for (const key of authorKeys) {
    if (properties[key] && properties[key].type === 'people' && Array.isArray(properties[key].people)) {
      return properties[key].people.map(person => person.name || '').filter(name => name);
    }
  }
  return [];
}

// Helper: Extract tag/slug from Notion properties
function extractTag(properties) {
  if (!properties) return null;
  
  // Look for tag/slug properties
  const tagKeys = ['tag', 'Tag', 'slug', 'Slug', 'url_slug'];
  for (const key of tagKeys) {
    const prop = properties[key];
    if (prop && prop.type === 'rich_text' && Array.isArray(prop.rich_text)) {
      return prop.rich_text.map(t => t.plain_text || '').join('');
    }
  }
  return null;
}

// Helper: Extract metadata from input
function extractMetadata(inputData) {
  // Check if first item has meta_data structure
  if (Array.isArray(inputData) && inputData.length > 0 && inputData[0].json) {
    const firstItem = inputData[0].json;
    if (firstItem.meta_data) {
      const meta = firstItem.meta_data;
      const properties = meta.properties || {};
      
      return {
        id: meta.id,
        url: meta.url,
        title: extractTitle(properties),
        date: extractDate(properties),
        authors: extractAuthors(properties),
        tag: extractTag(properties),
        created_time: meta.created_time,
        last_edited_time: meta.last_edited_time
      };
    }
  }
  return null;
}

// Helper: Format date for display
function formatDate(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch (e) {
    return dateString;
  }
}

// ===== n8n execution =====
const inputData = $input.all();

// Extract metadata if available
const metadata = extractMetadata(inputData);

// Handle different input formats from n8n
let blocks = [];
if (Array.isArray(inputData)) {
  // Check if we have items with json property (typical n8n structure)
  if (inputData.length > 0 && inputData[0].json) {
    // Extract json from each item
    blocks = inputData.flatMap(item => {
      const data = item.json;
      
      // Check for new structure with meta_data and content
      if (data && data.content && Array.isArray(data.content)) {
        // Extract blocks from content array
        return data.content.map(contentItem => contentItem.json || contentItem);
      }
      
      // If json contains an array, use it; otherwise wrap in array
      if (Array.isArray(data)) {
        return data;
      } else if (data && typeof data === 'object' && data.type) {
        // Single block
        return [data];
      }
      return [];
    });
  } else {
    // Direct array of blocks
    blocks = inputData;
  }
}

// Convert blocks to HTML
let html = convertNotionBlocksToHtml(blocks);

// Add article wrapper with metadata if available
if (metadata) {
  const parts = [];
  parts.push('<article>');
  
  // Add header with title and metadata
  if (metadata.title) {
    parts.push(` <a class="button button-main " href="/collection/blog">Blog</a> <header>`);
    parts.push(`    <h1>${escapeHtml(metadata.title)}</h1>`);
    
    // Add metadata section (date, authors)
    const metaParts = [];
    
    if (metadata.date) {
      metaParts.push(`<time datetime="${escapeHtml(metadata.date)}">${formatDate(metadata.date)}</time>`);
    }
    
    if (metadata.authors && metadata.authors.length > 0) {
      const authorList = metadata.authors.map(a => escapeHtml(a)).join(', ');
      metaParts.push(`<span>By ${authorList}</span>`);
    }
    
    if (metaParts.length > 0) {
      parts.push(`    <div>${metaParts.join(' • ')}</div>`);
    }
    
    parts.push(`  </header>`);
  }
  
  // Add main content
  parts.push('  <main> ');
  // Indent the HTML content
  const indentedHtml = html.split('\n').map(line => '    ' + line).join('\n');
  parts.push(indentedHtml);
  parts.push('  </main>');
  parts.push('</article>');
  
  html = parts.join('\n');
}

return [{ json: { html, metadata } }];
