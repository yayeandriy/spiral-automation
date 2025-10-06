# Notion API JSON Validator & Fixer

This script validates and automatically fixes common issues in Notion API JSON structures to ensure they're compatible with the Notion API.

## Features

### Validation Checks
- ✅ Valid block types (paragraph, headings 1-3, lists, etc.)
- ✅ Required properties for each block type
- ✅ Rich text structure and formatting
- ✅ Color values validation
- ✅ Nested children structure

### Auto-Fixes Applied
- 🔧 Removes empty blocks and objects
- 🔧 Converts invalid heading types (`heading_4`, `heading_5`, `heading_6` → `heading_3`)
- 🔧 Adds missing required properties
- 🔧 Fixes malformed rich text arrays
- 🔧 Validates and corrects annotations
- 🔧 Ensures proper nested structure

## Usage

### 1. Command Line Tool
```bash
# Navigate to the scripts directory
cd /Users/pluton/Agents/spiral/projects/misc/scripts

# Run validation on a JSON file
node validate_notion.js ../../target_landing/results/landing.json

# Output will show:
# - Validation status
# - List of errors found
# - List of fixes applied
# - Path to fixed JSON file
```

### 2. N8N Workflow Integration

Use the compact version in N8N Function nodes:

```javascript
// Copy the content from n8n_notion_validator.js into a Function node
const inputData = $json;
const result = validateAndFixNotionJson(inputData);

// Log validation results
console.log(`Fixes applied: ${result.summary.totalFixes}`);
console.log(`Errors found: ${result.summary.totalErrors}`);

// Return the fixed data for the next node
return result.fixedData;
```

### 3. Node.js Module

```javascript
const { validateAndFixNotionJson } = require('./notion_api_validator_fixer.js');

const jsonData = require('./your-notion-data.json');
const result = validateAndFixNotionJson(jsonData);

if (result.summary.isFullyValid) {
    console.log('✅ JSON is valid for Notion API');
} else {
    console.log(`🔧 Applied ${result.summary.totalFixes} fixes`);
    // Use result.fixedData for API calls
}
```

## Common Issues Fixed

1. **Invalid Heading Types**
   - `heading_4` → converted to `heading_3`
   - `heading_5` → converted to `heading_3`
   - `heading_6` → converted to `heading_3`

2. **Empty Blocks**
   - Removes blocks with no content
   - Removes blocks with only empty objects

3. **Missing Properties**
   - Adds missing `rich_text` arrays
   - Adds missing `type` properties
   - Adds default `content` for text objects

4. **Invalid Colors**
   - Removes unsupported color values
   - Validates against Notion's color palette

## Example Output

```
📊 VALIDATION RESULTS
══════════════════════════════════════════════════
Status: ✅ VALID
Errors found: 0
Fixes applied: 38

🔧 FIXES APPLIED:
1. Removed empty block
2. Converted heading_4 to heading_3
3. Added missing rich_text array
...

💾 Fixed version saved to: landing_fixed.json
```

## Files

- `notion_api_validator_fixer.js` - Full validation class with detailed error reporting
- `validate_notion.js` - CLI tool for validating JSON files
- `n8n_notion_validator.js` - Compact version for N8N workflows

## Notion API Block Types Supported

- Text blocks: `paragraph`, `heading_1`, `heading_2`, `heading_3`
- List blocks: `bulleted_list_item`, `numbered_list_item`, `to_do`
- Media blocks: `image`, `video`, `file`, `embed`
- Layout blocks: `column_list`, `column`, `divider`
- Advanced blocks: `code`, `quote`, `callout`, `table`
- And more...

## Tips

1. Always validate JSON before sending to Notion API
2. The fixed JSON maintains the same structure while ensuring compatibility
3. Use the CLI tool for development and the N8N version for production workflows
4. Check the validation summary to understand what was changed