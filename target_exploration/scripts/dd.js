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

// Helper: Generate media viewer HTML
function generateMediaViewer(mediaUrl, mediaType) {
  switch (mediaType) {
    case 'youtube':
      const youtubeEmbedUrl = getYouTubeEmbedUrl(mediaUrl);
      // Add autoplay, mute, loop, no controls, hide logo, minimal overlay, and 720p quality
      const enhancedUrl = youtubeEmbedUrl + (youtubeEmbedUrl.includes('?') ? '&' : '?') + 
        'autoplay=1&mute=1&loop=1&controls=0&modestbranding=1&playsinline=1&enablejsapi=1&rel=0&showinfo=0&iv_load_policy=3&disablekb=1&vq=hd720';
      return `<iframe id="youtube-player" src="${escapeHtml(enhancedUrl)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    
    case 'loom':
      const loomEmbedUrl = getLoomEmbedUrl(mediaUrl);
      return `<iframe src="${escapeHtml(loomEmbedUrl)}" frameborder="0" allowfullscreen></iframe>`;
    
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
  const mediaFiles = extractMediaFiles(properties);
  
  // Get the first media file if available
  const primaryMedia = mediaFiles.length > 0 ? mediaFiles[0] : null;
  const mediaType = primaryMedia ? detectMediaType(primaryMedia.url) : 'unknown';
  
  return {
    id: page.id,
    title: title || 'Untitled',
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
  // html.push('  <header>');
  // html.push('  </header>');
  
  // Main demo viewer (show first item by default)
  html.push('  <div class="demo-viewer" id="demo-viewer">');
  if (demoItems[0].mediaUrl) {
    html.push(`    ${generateMediaViewer(demoItems[0].mediaUrl, demoItems[0].mediaType)}`);
  } else {
    html.push('    <p>Embed your mp4 / YouTube / Loom demo here</p>');
  }
  html.push('  </div>');
  
  // Tabs for each demo item
  if (demoItems.length > 1) {
    html.push('  <nav class="demo-tabs">');
    for (let i = 0; i < demoItems.length; i++) {
      const item = demoItems[i];
      const isActive = i === 0 ? ' active' : '';
      html.push(`    <button class="demo-tab${isActive}" data-demo-id="${escapeHtml(item.id)}" data-media-url="${escapeHtml(item.mediaUrl || '')}" data-media-type="${escapeHtml(item.mediaType)}">`);
      html.push(`      <span>${escapeHtml(item.title)}</span>`);
      html.push('    </button>');
    }
    html.push('  </nav>');
  }
  
  html.push('</section>');
  
  // Add JavaScript for tab switching and YouTube control
  html.push('<script>');
  html.push('(function() {');
  html.push('  // Get all demo tabs');
  html.push('  const demoTabs = document.querySelectorAll(".demo-tab");');
  html.push('  const demoViewer = document.getElementById("demo-viewer");');
  html.push('  ');
  html.push('  if (!demoViewer || demoTabs.length === 0) return;');
  html.push('  ');
  html.push('  // Track YouTube player state');
  html.push('  let isYoutubePlaying = true;');
  html.push('  ');
  html.push('  // Setup click handler for YouTube pause/play');
  html.push('  function setupYouTubeClick() {');
  html.push('    const iframe = demoViewer.querySelector("#youtube-player");');
  html.push('    if (!iframe) return;');
  html.push('    ');
  html.push('    iframe.style.cursor = "pointer";');
  html.push('    iframe.addEventListener("click", function() {');
  html.push('      const iframeSrc = iframe.src;');
  html.push('      if (isYoutubePlaying) {');
  html.push('        // Pause by removing autoplay');
  html.push('        iframe.src = iframeSrc.replace("autoplay=1", "autoplay=0");');
  html.push('      } else {');
  html.push('        // Play by adding autoplay');
  html.push('        iframe.src = iframeSrc.replace("autoplay=0", "autoplay=1");');
  html.push('      }');
  html.push('      isYoutubePlaying = !isYoutubePlaying;');
  html.push('    });');
  html.push('  }');
  html.push('  ');
  html.push('  // Media viewer generator function');
  html.push('  function generateMediaViewer(url, type) {');
  html.push('    switch(type) {');
  html.push('      case "youtube":');
  html.push('        const youtubeMatch = url.match(/(?:youtube\\.com\\/watch\\?v=|youtu\\.be\\/)([^&?\\/\\s]+)/);');
  html.push('        const youtubeId = youtubeMatch ? youtubeMatch[1] : "";');
  html.push('        if (youtubeId) {');
  html.push('          const enhancedUrl = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&controls=0&modestbranding=1&playsinline=1&enablejsapi=1&rel=0&showinfo=0&iv_load_policy=3&disablekb=1&vq=hd720`;');
  html.push('          return `<iframe id="youtube-player" src="${enhancedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;');
  html.push('        }');
  html.push('        break;');
  html.push('      case "loom":');
  html.push('        const loomMatch = url.match(/loom\\.com\\/share\\/([^?\\/\\s]+)/);');
  html.push('        const loomId = loomMatch ? loomMatch[1] : "";');
  html.push('        if (loomId) {');
  html.push('          return `<iframe src="https://www.loom.com/embed/${loomId}" frameborder="0" allowfullscreen></iframe>`;');
  html.push('        }');
  html.push('        break;');
  html.push('      case "image":');
  html.push('        return `<img src="${url}" alt="Demo image">`;');
  html.push('      case "video":');
  html.push('        return `<video controls><source src="${url}" type="video/mp4">Your browser does not support the video tag.</video>`;');
  html.push('      default:');
  html.push('        return "<p>Embed your mp4 / YouTube / Loom demo here</p>";');
  html.push('    }');
  html.push('    return "<p>Media not available</p>";');
  html.push('  }');
  html.push('  ');
  html.push('  // Add click handler to each tab');
  html.push('  demoTabs.forEach(function(tab) {');
  html.push('    tab.addEventListener("click", function() {');
  html.push('      // Remove active class from all tabs');
  html.push('      demoTabs.forEach(function(t) {');
  html.push('        t.classList.remove("active");');
  html.push('      });');
  html.push('      ');
  html.push('      // Add active class to clicked tab');
  html.push('      tab.classList.add("active");');
  html.push('      ');
  html.push('      // Get media data from tab');
  html.push('      const mediaUrl = tab.getAttribute("data-media-url");');
  html.push('      const mediaType = tab.getAttribute("data-media-type");');
  html.push('      ');
  html.push('      // Update viewer content');
  html.push('      if (mediaUrl && mediaType) {');
  html.push('        demoViewer.innerHTML = generateMediaViewer(mediaUrl, mediaType);');
  html.push('        // Reset YouTube state and setup click handler if YouTube video');
  html.push('        if (mediaType === "youtube") {');
  html.push('          isYoutubePlaying = true;');
  html.push('          setTimeout(setupYouTubeClick, 100);');
  html.push('        }');
  html.push('      } else {');
  html.push('        demoViewer.innerHTML = "<p>Embed your mp4 / YouTube / Loom demo here</p>";');
  html.push('      }');
  html.push('    });');
  html.push('  });');
  html.push('  ');
  html.push('  // Setup YouTube click handler for initial load');
  html.push('  if (demoViewer.querySelector("#youtube-player")) {');
  html.push('    setTimeout(setupYouTubeClick, 100);');
  html.push('  }');
  html.push('})();');
  html.push('</script>');
  
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
