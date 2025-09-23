// n8n JavaScript script to generate HTML from docs_blocks.json
// This script converts Notion-style blocks into a structured HTML document

// Get input data and handle different formats
const allInputs = $input.all();
let blocks = [];

// Handle n8n input - could be multiple items or single item
if (allInputs.length > 1) {
  // Multiple input items - each item is a block
  blocks = allInputs.map(item => item.json);
} else if (allInputs.length === 1) {
  const inputData = allInputs[0].json;
  
  // Handle different single input formats
  if (Array.isArray(inputData)) {
    blocks = inputData;
  } else if (inputData.children && Array.isArray(inputData.children)) {
    blocks = inputData.children;
  } else if (typeof inputData === 'object' && inputData !== null) {
    // Check if this is a single block
    if (inputData.type) {
      blocks = [inputData];
    } else {
      // Try to find an array property
      const arrayKeys = Object.keys(inputData).filter(key => Array.isArray(inputData[key]));
      if (arrayKeys.length > 0) {
        blocks = inputData[arrayKeys[0]];
      }
    }
  }
}

// Validate blocks is an array
if (!Array.isArray(blocks)) {
  return {
    json: {
      error: "Could not extract blocks array from input data.",
      debug: {
        totalInputs: allInputs.length,
        inputType: typeof (allInputs[0]?.json),
        firstInputKeys: allInputs[0]?.json ? Object.keys(allInputs[0].json) : [],
        firstInputSample: allInputs[0]?.json
      }
    }
  };
}

// Helper function to extract plain text from rich text array
function extractPlainText(richTextArray) {
  if (!richTextArray || !Array.isArray(richTextArray)) return '';
  return richTextArray.map(item => item.plain_text || item.text?.content || '').join('');
}

// Helper function to convert rich text to HTML with formatting
function richTextToHtml(richTextArray) {
  if (!richTextArray || !Array.isArray(richTextArray)) return '';
  
  return richTextArray.map(item => {
    let text = item.plain_text || item.text?.content || '';
    const annotations = item.annotations || {};
    
    if (annotations.bold) text = `<strong>${text}</strong>`;
    if (annotations.italic) text = `<em>${text}</em>`;
    if (annotations.code) text = `<code class="inline-code">${text}</code>`;
    if (annotations.underline) text = `<u>${text}</u>`;
    if (annotations.strikethrough) text = `<s>${text}</s>`;
    if (item.href || item.text?.link) {
      const url = item.href || item.text.link.url;
      text = `<a href="${url}" class="text-blue-600 hover:text-blue-800 underline">${text}</a>`;
    }
    
    return text;
  }).join('');
}

// Helper function to create navigation ID from text
function createNavId(text) {
  return text.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Process blocks and organize into sections
const sections = [];
let currentSection = null;
let listItems = [];
let listType = null;

blocks.forEach(block => {
  // Skip blocks that don't have the expected structure
  if (!block || typeof block !== 'object' || !block.type) {
    return;
  }
  
  const blockType = block.type;
  
  // Handle heading_1 as new section
  if (blockType === 'heading_1') {
    // Close any open list
    if (listItems.length > 0) {
      const listHtml = listType === 'bulleted_list_item' 
        ? `<ul class="space-y-2 mb-8">${listItems.join('')}</ul>`
        : `<ol class="space-y-2 mb-8 list-decimal list-inside">${listItems.join('')}</ol>`;
      
      if (currentSection) {
        currentSection.content += listHtml;
      }
      listItems = [];
      listType = null;
    }
    
    const title = extractPlainText(block.heading_1?.text);
    const navId = createNavId(title);
    
    currentSection = {
      id: navId,
      title: title,
      content: ''
    };
    sections.push(currentSection);
  }
  
  // Handle other block types
  else if (currentSection) {
    // Close list if switching to non-list block
    if (blockType !== 'bulleted_list_item' && blockType !== 'numbered_list_item' && listItems.length > 0) {
      const listHtml = listType === 'bulleted_list_item' 
        ? `<ul class="space-y-2 mb-8">${listItems.join('')}</ul>`
        : `<ol class="space-y-2 mb-8 list-decimal list-inside">${listItems.join('')}</ol>`;
      
      currentSection.content += listHtml;
      listItems = [];
      listType = null;
    }
    
    switch (blockType) {
      case 'paragraph':
        const paragraphText = richTextToHtml(block.paragraph?.text);
        if (paragraphText.trim()) {
          currentSection.content += `<p class="text-vercel-gray mb-6 leading-relaxed">${paragraphText}</p>\n`;
        }
        break;
        
      case 'heading_2':
        const h2Text = richTextToHtml(block.heading_2?.text);
        currentSection.content += `<h2 class="text-2xl font-semibold text-vercel-fg mb-6 mt-8">${h2Text}</h2>\n`;
        break;
        
      case 'heading_3':
        const h3Text = richTextToHtml(block.heading_3?.text);
        currentSection.content += `<h3 class="text-xl font-semibold text-vercel-fg mb-4">${h3Text}</h3>\n`;
        break;
        
      case 'callout':
        const calloutText = richTextToHtml(block.callout?.text);
        const icon = block.callout?.icon?.emoji || 'ℹ️';
        const calloutClass = icon === '⚠️' ? 'callout-warning' : 'callout-info';
        currentSection.content += `<div class="${calloutClass} p-4 rounded-lg mb-8"><p class="text-sm text-vercel-fg m-0">${calloutText}</p></div>\n`;
        break;
        
      case 'bulleted_list_item':
      case 'numbered_list_item':
        const listText = richTextToHtml(block[blockType]?.text);
        if (listType !== blockType) {
          listType = blockType;
        }
        listItems.push(`<li class="flex items-start"><svg class="w-5 h-5 text-vercel-fg mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg><span class="text-vercel-gray">${listText}</span></li>`);
        break;
        
      case 'code':
        const codeText = extractPlainText(block.code?.text);
        const language = block.code?.language || '';
        currentSection.content += `<div class="code-block p-4 mb-6"><pre><code class="language-${language}">${codeText}</code></pre></div>\n`;
        break;
        
      case 'quote':
        const quoteText = richTextToHtml(block.quote?.text);
        currentSection.content += `<blockquote class="border-l-4 border-vercel-border pl-4 italic text-vercel-gray mb-6">${quoteText}</blockquote>\n`;
        break;
    }
  }
});

// Close any remaining list
if (listItems.length > 0 && currentSection) {
  const listHtml = listType === 'bulleted_list_item' 
    ? `<ul class="space-y-2 mb-8">${listItems.join('')}</ul>`
    : `<ol class="space-y-2 mb-8 list-decimal list-inside">${listItems.join('')}</ol>`;
  
  currentSection.content += listHtml;
}

// Handle case where no sections were found
if (sections.length === 0) {
  return {
    json: {
      error: "No sections found. Make sure your input contains blocks with 'heading_1' type to create sections.",
      debug: {
        totalInputs: allInputs.length,
        blocksFound: blocks.length,
        blockTypes: blocks.map(b => b?.type).filter(Boolean),
        firstFewBlocks: blocks.slice(0, 3),
        hasHeading1: blocks.some(b => b?.type === 'heading_1')
      }
    }
  };
}

// Generate navigation
const navigation = sections.map(section => 
  `<a href="#${section.id}" class="block px-3 py-2 text-sm font-medium text-vercel-gray hover:text-vercel-fg hover:bg-vercel-accent-1 rounded-lg transition-colors">${section.title}</a>`
).join('\n                        ');

// Generate sections HTML
const sectionsHtml = sections.map(section => `
            <section id="${section.id}" class="mb-16">
                <h1 class="text-4xl font-bold text-vercel-fg mb-4">${section.title}</h1>
                ${section.content}
            </section>`).join('\n');

// Generate complete HTML document
const htmlDocument = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Documentation - Generated from Blocks</title>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        'inter': ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
                        'mono': ['SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'monospace'],
                    },
                    colors: {
                        'vercel-fg': '#000000',
                        'vercel-bg': '#ffffff',
                        'vercel-gray': '#666666',
                        'vercel-light-gray': '#999999',
                        'vercel-border': '#eaeaea',
                        'vercel-accent-1': '#fafafa',
                        'vercel-accent-2': '#eaeaea',
                        'vercel-accent-3': '#999999',
                        'vercel-accent-4': '#888888',
                        'vercel-accent-5': '#666666',
                        'vercel-accent-6': '#444444',
                        'vercel-accent-7': '#333333',
                        'vercel-accent-8': '#111111',
                    }
                }
            }
        }
    </script>
    <style>
        .code-block {
            background: #fafafa;
            border: 1px solid #eaeaea;
            border-radius: 8px;
        }
        .callout-info {
            background: linear-gradient(90deg, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0.02) 100%);
            border-left: 3px solid #000000;
        }
        .callout-warning {
            background: linear-gradient(90deg, rgba(102, 102, 102, 0.1) 0%, rgba(102, 102, 102, 0.05) 100%);
            border-left: 3px solid #666666;
        }
        .inline-code {
            background: #f1f1f1;
            padding: 2px 4px;
            border-radius: 3px;
            font-size: 0.9em;
        }
    </style>
</head>
<body class="font-inter antialiased text-vercel-fg bg-vercel-bg">
   

    <div class="max-w-7xl mx-auto px-6 py-8">
        <div class="flex gap-8">
            <!-- Sidebar Navigation -->
            <nav class="hidden lg:block w-64 flex-shrink-0">
                <div class="sticky top-8">
                    <div class="space-y-1">
                        ${navigation}
                    </div>
                </div>
            </nav>
           
            <main>
                ${sectionsHtml}
            </main>
            
            <script>
                // Smooth scrolling for navigation links
                document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                    anchor.addEventListener('click', function (e) {
                        e.preventDefault();
                        const target = document.querySelector(this.getAttribute('href'));
                        if (target) {
                            target.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start'
                            });
                        }
                    });
                });
            </script>
        </div>
    </div>
</body>
</html>`;

// Return the generated HTML
return {
  json: {
    html: htmlDocument,
    sections: sections.map(s => ({ id: s.id, title: s.title })),
    totalSections: sections.length
  }
};