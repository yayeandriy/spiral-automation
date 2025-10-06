# Documentation Section Schema

This directory contains the JSON schema and validation tools for documentation section files.

## 📋 Schema Overview

The `section-schema.json` defines the structure and validation rules for individual documentation section files. Each section file must conform to this schema to ensure consistency and proper processing.

### Required Properties

- **`name`** (string): Human-readable section name (1-100 characters)
- **`tag`** (string): URL-friendly identifier following kebab-case pattern
- **`description`** (string): Brief section overview (10-500 characters)
- **`children`** (array): List of subsections with detailed content

### Optional Properties

- **`metadata`** (object): Version, author, update info, and other metadata

## 🏗️ Child Structure

Each child in the `children` array must have:

- **`name`** (string): Subsection name (1-100 characters)
- **`description`** (string): Detailed content description (10-2000 characters)
- **`bullet_points`** (array, optional): Key points as bulleted list items (1-15 items, 5-200 chars each)
- **`links`** (array, optional): Related links with title, URL, and description
- **`code_examples`** (array, optional): Code snippets with language and explanation
- **`tags`** (array, optional): Content categorization tags

## 🎯 Schema Features

### Validation Rules
- **String Length Limits**: Prevents overly long or empty content
- **Pattern Matching**: Ensures tags follow kebab-case format
- **Array Constraints**: Controls minimum/maximum items in lists
- **Required Fields**: Enforces essential properties
- **Type Safety**: Validates data types for all properties

### Extensibility
- **Additional Properties**: Controlled via schema settings
- **Flexible Metadata**: Accommodates various organizational needs
- **Optional Enhancements**: Links, code examples, and tags support rich content

## 🔍 Validation

### Using the Validator

```bash
# Validate all sections in default directory
node validate-sections.js

# Validate specific directory
node validate-sections.js /path/to/sections

# Validate single file (programmatic)
const { validateSectionFile } = require('./validate-sections');
const result = validateSectionFile('./01-overview.json');
```

### Validation Output

```
📋 Section Validation Report
==================================================
Total files processed: 12
✅ Valid files: 11
❌ Invalid files: 1

✅ Valid Sections:
  01-overview.json - Overview (4 children)
  02-getting-started.json - Getting Started (5 children)
  
❌ Invalid Sections:
  03-features.json - Features
    - Missing required property: children
    - String too long at description: maximum length is 500
```

## 📝 Example Section File

```json
{
  "name": "Overview",
  "tag": "overview",
  "description": "High-level introduction to the product",
  "children": [
    {
      "name": "Product Introduction",
      "description": "Comprehensive product overview...",
      "bullet_points": [
        "Advanced automated inspection solution",
        "Micron-level accuracy measurement",
        "Real-time quality validation"
      ],
      "tags": ["introduction", "overview"]
    }
  ],
  "metadata": {
    "version": "1.0.0",
    "last_updated": "2025-09-30",
    "author": "Documentation Team",
    "priority": "high",
    "target_audience": ["developers", "managers"]
  }
}
```

## 🛠️ Schema Maintenance

### Updating the Schema
1. Modify `section-schema.json`
2. Update validation logic in `validate-sections.js` if needed
3. Test with existing section files
4. Update this README with any changes

### Adding New Properties
1. Define in `schema.properties` or `definitions.child.properties`
2. Set appropriate validation rules (type, length, pattern, etc.)
3. Mark as required if mandatory
4. Add examples and documentation

### Version Control
- Use semantic versioning for schema changes
- Document breaking changes
- Provide migration guides for existing files

## 🎨 Best Practices

### Content Guidelines
- **Descriptions**: Clear, concise, and informative
- **Bullet Points**: Actionable and specific (avoid generic statements)
- **Tags**: Use consistent, lowercase, hyphenated terms
- **Names**: Descriptive but not overly verbose

### File Organization
- Use numbered prefixes for logical ordering (01-, 02-, etc.)
- Follow consistent naming patterns
- Keep related sections grouped together

### Validation Workflow
- Validate before committing changes
- Use validation in CI/CD pipelines
- Regular schema compliance checks
- Automated validation in content management workflows

## 🔗 Integration

### With n8n Scripts
The section schema is designed to work seamlessly with the n8n conversion scripts:

- **section_to_blocks.js**: Processes schema-compliant sections into Notion blocks
- **Bullet point handling**: Converts `bullet_points` arrays into Notion list items
- **Metadata support**: Uses schema metadata for processing analytics

### With Documentation Tools
- **Static site generators**: Schema provides structured data for automated site generation
- **API documentation**: Schema enables programmatic documentation processing
- **Content management**: Schema supports headless CMS integration

## 📊 Schema Statistics

Current schema supports:
- 12 core documentation sections
- Unlimited children per section (recommended: 3-8)
- Up to 15 bullet points per child
- Flexible metadata and tagging system
- Multiple content types (text, links, code examples)

---

**Schema Version**: 1.0.0  
**Last Updated**: 2025-09-30  
**Compatibility**: n8n conversion scripts v1.0+