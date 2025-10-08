// n8n script to convert Notion pages into Demo component HTML
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

// Helper: Extract title from Notion page properties
function extractTitle(properties) {
  if (!properties) return '';
  
  for (const key in properties) {
    const prop = properties[key];
    if (prop.type === 'title' && prop.title && Array.isArray(prop.title)) {
      return prop.title.map(t => t.plain_text || '').join('');
    }
  }
  return '';
}

// Helper: Extract description from Notion page properties
function extractDescription(properties) {
  if (!properties) return '';
  
  // Look for common description property names
  const descriptionKeys = ['Description', 'description', 'Summary', 'summary', 'Excerpt', 'excerpt'];
  
  for (const key of descriptionKeys) {
    const prop = properties[key];
    if (prop && prop.type === 'rich_text' && Array.isArray(prop.rich_text)) {
      return prop.rich_text.map(t => t.plain_text || '').join('');
    }
  }
  
  return '';
}

// Helper: Extract media files from Notion page properties
function extractMediaFiles(properties) {
  if (!properties) return [];
  
  const mediaFiles = [];
  
  for (const key in properties) {
    const prop = properties[key];
    if (prop.type === 'files' && Array.isArray(prop.files)) {
      for (const file of prop.files) {
        if (file.type === 'external' && file.external && file.external.url) {
          mediaFiles.push({
            url: file.external.url,
            name: file.name || '',
            type: 'external'
          });
        } else if (file.type === 'file' && file.file && file.file.url) {
          mediaFiles.push({
            url: file.file.url,
            name: file.name || '',
            type: 'file'
          });
        }
      }
    }
  }
  
  return mediaFiles;
}

// Helper: Detect media type from URL
function detectMediaType(url) {
  if (!url) return 'unknown';
  
  const lowerUrl = url.toLowerCase();
  
  // YouTube
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    return 'youtube';
  }
  
  // Loom
  if (lowerUrl.includes('loom.com')) {
    return 'loom';
  }
  
  // Veed.io
  if (lowerUrl.includes('veed.io')) {
    return 'veed';
  }
  
  // Image formats
  if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i)) {
    return 'image';
  }
  
  // Video formats
  if (lowerUrl.match(/\.(mp4|webm|ogg|mov)(\?|$)/i)) {
    return 'video';
  }
  
  return 'unknown';
}

// Helper: Convert YouTube URL to embed URL
function getYouTubeEmbedUrl(url) {
  // Extract video ID from various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?\/\s]+)/,
    /youtube\.com\/embed\/([^&?\/\s]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }
  
  return url;
}

// Helper: Convert Loom URL to embed URL
function getLoomEmbedUrl(url) {
  // Extract video ID from Loom URL
  const match = url.match(/loom\.com\/share\/([^?\/\s]+)/);
  if (match && match[1]) {
    return `https://www.loom.com/embed/${match[1]}`;
  }
  return url;
}

// Helper: Convert Veed.io URL to embed URL
function getVeedEmbedUrl(url) {
  // Extract video ID from Veed.io URL
  // Supports multiple formats:
  // - https://www.veed.io/view/aa5e7a5a-0c6f-4d1e-9b2d-c7ad423fe5b7?panel=share
  // - https://veed.io/view/abc123
  // - https://www.veed.io/embed/abc123 (already embed format)
  
  // Check if already in embed format
  if (url.includes('/embed/')) {
    return url;
  }
  
  // Extract from /view/ format (supports UUIDs and other ID formats)
  // Pattern matches: alphanumeric, hyphens, and underscores
  const viewMatch = url.match(/veed\.io\/view\/([a-zA-Z0-9_-]+)/);
  if (viewMatch && viewMatch[1]) {
    return `https://www.veed.io/embed/${viewMatch[1]}`;
  }
  
  // Try to extract any ID-like pattern after veed.io/
  const genericMatch = url.match(/veed\.io\/([a-zA-Z0-9_-]+)/);
  if (genericMatch && genericMatch[1] && genericMatch[1] !== 'view' && genericMatch[1] !== 'embed') {
    return `https://www.veed.io/embed/${genericMatch[1]}`;
  }
  
  // Return original URL if no pattern matches
  return url;
}

// Helper: Generate media viewer HTML
function generateMediaViewer(mediaUrl, mediaType) {
  switch (mediaType) {
    case 'youtube':
      const youtubeEmbedUrl = getYouTubeEmbedUrl(mediaUrl);
      // Add autoplay, mute, loop, no controls, hide logo, minimal overlay, and 720p quality
      const enhancedUrl = youtubeEmbedUrl + (youtubeEmbedUrl.includes('?') ? '&' : '?') + 
        'autoplay=1&mute=1&loop=1&controls=0&modestbranding=1&playsinline=1&enablejsapi=1&rel=0&showinfo=0&iv_load_policy=3&disablekb=1&vq=hd720&fs=0&color=white&origin=' + encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '');
      return `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;"><iframe id="youtube-player" src="${escapeHtml(enhancedUrl)}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; pointer-events: auto;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
    
    case 'loom':
      const loomEmbedUrl = getLoomEmbedUrl(mediaUrl);
      return `<iframe src="${escapeHtml(loomEmbedUrl)}" frameborder="0" allowfullscreen></iframe>`;
    
    case 'veed':
      const veedEmbedUrl = getVeedEmbedUrl(mediaUrl);
      return `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;"><iframe src="${escapeHtml(veedEmbedUrl)}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`;
    
    case 'image':
      return `<img src="${escapeHtml(mediaUrl)}" alt="Demo image">`;
    
    case 'video':
      return `<video controls><source src="${escapeHtml(mediaUrl)}" type="video/mp4">Your browser does not support the video tag.</video>`;
    
    default:
      return `<p>Embed your mp4 / YouTube / Loom demo here</p>`;
  }
}

// Helper: Process a single Notion page into demo item
function processPage(page) {
  const properties = page.properties || {};
  const title = extractTitle(properties);
  const description = extractDescription(properties);
  const mediaFiles = extractMediaFiles(properties);
  
  // Get the first media file if available
  const primaryMedia = mediaFiles.length > 0 ? mediaFiles[0] : null;
  const mediaType = primaryMedia ? detectMediaType(primaryMedia.url) : 'unknown';
  
  return {
    id: page.id,
    title: title || 'Untitled',
    description: description || '',
    mediaUrl: primaryMedia ? primaryMedia.url : null,
    mediaType: mediaType,
    mediaFiles: mediaFiles
  };
}

// Main function: Convert Notion pages to Demo component HTML
function convertNotionPagesToDemo(pages) {
  if (!Array.isArray(pages) || pages.length === 0) {
    return '<section><p>No demo items available</p></section>';
  }
  
  // Process all pages
  const demoItems = pages
    .map(processPage)
    .filter(item => item.title) // Filter out items without titles
    .sort((a, b) => a.title.localeCompare(b.title)); // Sort alphabetically by title
  
  if (demoItems.length === 0) {
    return '<section><p>No demo items available</p></section>';
  }
  
  // Build HTML
  const html = [];
  html.push('<section class="demo-section">');
  
  // Container for side-by-side layout
  html.push('  <div class="demo-container">');
  
  // Main demo viewer (show first item by default)
  html.push('    <div class="demo-viewer" id="demo-viewer">');
  if (demoItems[0].mediaUrl) {
    html.push(`      ${generateMediaViewer(demoItems[0].mediaUrl, demoItems[0].mediaType)}`);
  } else {
    html.push('      <p>Embed your mp4 / YouTube / Loom demo here</p>');
  }
  html.push('    </div>');
  
  // Tabs sidebar with title and description
  html.push('    <nav class="demo-tabs">');
  for (let i = 0; i < demoItems.length; i++) {
    const item = demoItems[i];
    const isActive = i === 0 ? ' active' : '';
    html.push(`      <button class="demo-tab${isActive}" data-demo-id="${escapeHtml(item.id)}" data-media-url="${escapeHtml(item.mediaUrl || '')}" data-media-type="${escapeHtml(item.mediaType)}">`);
    html.push(`        <h4>${escapeHtml(item.title)}</h4>`);
    if (item.description) {
      html.push(`        <p>${escapeHtml(item.description)}</p>`);
    }
    html.push('      </button>');
  }
  html.push('    </nav>');
  
  html.push('  </div>');
  html.push('</section>');
  
  return html.join('\n');
}

// ===== n8n execution =====
const inputData = $input.all();

// Extract pages from input
let pages = [];
if (Array.isArray(inputData)) {
  if (inputData.length > 0 && inputData[0].json) {
    // n8n format with json wrapper
    pages = inputData.map(item => item.json);
  } else {
    // Direct array of pages
    pages = inputData;
  }
}

// Filter out archived or trashed pages
pages = pages.filter(p => p && !p.archived && !p.in_trash);

// Convert to HTML
const html = convertNotionPagesToDemo(pages);

// Return detailed results
const demoItems = pages.map(processPage).filter(item => item.title);

return [{
  json: {
    html: html,
    demo_items: demoItems,
    items_count: demoItems.length
  }
}];
