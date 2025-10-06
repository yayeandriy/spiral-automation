# Documentation Section Schemas - Numbered Edition

This directory contains JSON schemas for validating documentation section files. Each schema is numbered to correspond with the section files and provides specific validation rules tailored to that section type.

## Schema Files

| Section | Schema File | Description |
|---------|-------------|-------------|
| 01 | `01-overview-section-schema.json` | Schema for Overview section |
| 02 | `02-getting-started-section-schema.json` | Schema for Getting Started section |
| 03 | `03-features-section-schema.json` | Schema for Features section |
| 04 | `04-use-cases-section-schema.json` | Schema for Use Cases section |
| 05 | `05-workflow-section-schema.json` | Schema for Workflow section |
| 06 | `06-troubleshooting-section-schema.json` | Schema for Troubleshooting section |
| 07 | `07-api-documentation-section-schema.json` | Schema for API Documentation section |
| 08 | `08-security-compliance-section-schema.json` | Schema for Security & Compliance section |
| 09 | `09-administration-section-schema.json` | Schema for Administration section |
| 10 | `10-integration-guide-section-schema.json` | Schema for Integration Guide section |
| 11 | `11-training-support-section-schema.json` | Schema for Training & Support section |
| 12 | `12-release-notes-section-schema.json` | Schema for Release Notes section |

## Schema Index

- `section-schemas-index.json` - Master index mapping section tags to their corresponding schema files

## Validation Tools

- `validate-all-sections.js` - Multi-schema validation tool that automatically selects the correct schema based on section tag
- `validate-sections.js` - Original validation tool (legacy)

## Usage

### Validate All Sections
```bash
node validate-all-sections.js ../sections/
```

### Validate Specific File
```bash
node validate-all-sections.js --file ../sections/01-overview.json
```

### Get Help
```bash
node validate-all-sections.js --help
```

## Schema Features

Each section-specific schema includes:
- **Tailored validation rules** for that section type
- **Specific property constraints** (string lengths, patterns, enums)
- **Section-appropriate child definitions** 
- **Content validation** for bullet points, descriptions, etc.
- **Metadata validation** with appropriate audience targeting

## Example Output

```
🔍 Validating 12 section files in: ../sections/
================================================================================

📄 01-overview.json (01-overview-section-schema.json)
   Status: ✅ VALID
   Section: Overview (overview)
   Children: 4
   Metadata: Yes

📊 VALIDATION SUMMARY REPORT
================================================================================
Total Files: 12
Valid Files: 12 ✅
Invalid Files: 0 ❌
Success Rate: 100.0%
```

## Schema Mapping

Each section file's `tag` property determines which schema is used:

| Tag | Schema File |
|-----|-------------|
| `overview` | `01-overview-section-schema.json` |
| `getting-started` | `02-getting-started-section-schema.json` |
| `features` | `03-features-section-schema.json` |
| `use-cases` | `04-use-cases-section-schema.json` |
| `workflow` | `05-workflow-section-schema.json` |
| `troubleshooting` | `06-troubleshooting-section-schema.json` |
| `api-docs` | `07-api-documentation-section-schema.json` |
| `security-compliance` | `08-security-compliance-section-schema.json` |
| `administration` | `09-administration-section-schema.json` |
| `integration` | `10-integration-guide-section-schema.json` |
| `training-support` | `11-training-support-section-schema.json` |
| `release-notes` | `12-release-notes-section-schema.json` |

## Integration

The schemas integrate seamlessly with:
- **n8n workflows** for automated validation
- **CI/CD pipelines** for quality assurance  
- **Documentation tools** for content validation
- **JSON Schema validators** for standards compliance

---

*Last updated: September 30, 2025*