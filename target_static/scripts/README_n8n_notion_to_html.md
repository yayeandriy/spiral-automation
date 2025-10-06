# N8N Notion Blocks to HTML Converter

## Overview
This script converts Notion API blocks response to clean HTML using Tailwind CSS classes. It's designed for use in n8n workflows to transform Notion content into web-ready HTML.

## Features

### Supported Block Types
- ✅ **Text Blocks**: paragraph, heading_1, heading_2, heading_3
- ✅ **Lists**: bulleted_list_item, numbered_list_item
- ✅ **Layout**: column_list, column, divider
- ✅ **Media**: image, video, file, embed
- ✅ **Interactive**: to_do, toggle, bookmark
- ✅ **Code**: code blocks with syntax highlighting
- ✅ **Content**: quote, callout

### Rich Text Features
- ✅ **Formatting**: bold, italic, strikethrough, underline, code
- ✅ **Colors**: All Notion colors mapped to Tailwind classes
- ✅ **Links**: External and internal links
- ✅ **Nested Content**: Lists and toggles with children

## Usage in n8n

### Method 1: Direct Function Call
```javascript
// In your n8n Code node
const blocks = $input.all()[0].json.blocks; // Your Notion blocks array
const html = convertNotionBlocksToHtml(blocks);
return [{ json: { html } }];
```

### Method 2: Use Main Function (Recommended)
```javascript
// Simply call the main function
return main();
```

### Input Format
The script accepts input in multiple formats:

1. **Direct array of blocks**:
```json
[
  {
    "type": "paragraph",
    "paragraph": {
      "text": [...]
    }
  }
]
```

2. **n8n wrapped format**:
```json
{
  "json": {
    "blocks": [...],
    // or
    "children": [...]
  }
}
```

### Output Format
```json
{
  "html": "<div>Generated HTML content</div>",
  "blockCount": 15,
  "success": true,
  "timestamp": "2025-10-02T10:00:00.000Z"
}
```

## Tailwind CSS Classes Used

### Typography
- `text-black` - Default black text
- `text-3xl font-bold` - H1 headings
- `text-2xl font-semibold` - H2 headings  
- `text-xl font-medium` - H3 headings
- `leading-relaxed` - Paragraph line height

### Layout
- `flex flex-wrap gap-4` - Column layouts
- `flex-1 min-w-0` - Column containers
- `mb-4`, `mb-6`, `mt-8` - Margins for spacing

### Colors (Notion to Tailwind mapping)
- `gray` → `text-gray-600` / `bg-gray-50`
- `blue` → `text-blue-600` / `bg-blue-50`
- `green` → `text-green-600` / `bg-green-50`
- `red` → `text-red-600` / `bg-red-50`
- `yellow` → `text-yellow-600` / `bg-yellow-50`
- `orange` → `text-orange-600` / `bg-orange-50`
- `purple` → `text-purple-600` / `bg-purple-50`
- `pink` → `text-pink-600` / `bg-pink-50`
- `brown` → `text-amber-700` / `bg-amber-50`

### Components
- **Code blocks**: `bg-gray-100 rounded-lg p-4 overflow-x-auto`
- **Images**: `w-full h-auto rounded-lg shadow-sm`
- **Callouts**: `border border-gray-200 rounded-lg p-4`
- **Quotes**: `border-l-4 border-gray-400 pl-4 py-2 italic`
- **To-dos**: Custom checkbox styling with checkmarks

## Example n8n Workflow

1. **HTTP Request Node**: Fetch blocks from Notion API
2. **Code Node**: Use this script to convert blocks to HTML
3. **Output**: Use generated HTML in email, webhooks, etc.

```javascript
// Complete n8n Code node example
const notionBlocks = $input.all()[0].json.results; // Notion API response

try {
  const html = convertNotionBlocksToHtml(notionBlocks);
  const processedHtml = postProcessHtml(html);
  
  return [{ 
    json: { 
      html: processedHtml,
      success: true,
      blockCount: notionBlocks.length 
    } 
  }];
} catch (error) {
  return [{ 
    json: { 
      error: error.message, 
      success: false 
    } 
  }];
}
```

## Customization

### Adding New Block Types
To support additional block types, add cases to the `convertBlockToHtml` function:

```javascript
case 'your_new_block_type':
  return convertYourNewBlockType(block);
```

### Modifying Styles
Update the Tailwind classes in each conversion function:

```javascript
// Example: Change paragraph styling
function convertParagraph(block) {
  return `<p class="text-gray-800 mb-3 text-lg">${content}</p>`;
}
```

### Custom Color Mapping
Modify the `getColorClass` function to change color mappings:

```javascript
const colorMap = {
  text: {
    gray: 'text-slate-600', // Custom color
    // ... other colors
  }
};
```

## Error Handling

The script includes comprehensive error handling:
- Invalid input formats
- Missing block properties
- Unsupported block types (logged as warnings)
- HTML escaping for security

## Performance Notes

- Processes large block arrays efficiently
- Minimal memory footprint
- No external dependencies
- Compatible with n8n's JavaScript environment

## Security

- All user content is HTML-escaped
- External links include `rel="noopener noreferrer"`
- No inline scripts or styles generated
- Safe for use in emails and web content