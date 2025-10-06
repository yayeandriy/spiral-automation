#!/usr/bin/env node

/**
 * Section Schema Validator - Multi-Schema Edition
 * 
 * Validates documentation section files against their specific schemas
 * based on the section tag. Each section type has its own tailored schema
 * with appropriate validation rules and constraints.
 * 
 * Usage:
 *   node validate-all-sections.js [directory]
 *   node validate-all-sections.js --file <filepath>
 *   node validate-all-sections.js --help
 */

const fs = require('fs');
const path = require('path');

class MultiSectionValidator {
  constructor() {
    this.schemasDir = path.join(__dirname, '.');
    this.schemaIndex = this.loadSchemaIndex();
    this.validationResults = [];
  }

  /**
   * Load the schema index to map section tags to their schemas
   */
  loadSchemaIndex() {
    try {
      const indexPath = path.join(this.schemasDir, 'section-schemas-index.json');
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      const index = JSON.parse(indexContent);
      return index.schemas;
    } catch (error) {
      console.error('Failed to load schema index:', error.message);
      process.exit(1);
    }
  }

  /**
   * Load a specific schema file
   */
  loadSchema(schemaFileName) {
    try {
      const schemaPath = path.join(this.schemasDir, schemaFileName);
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      return JSON.parse(schemaContent);
    } catch (error) {
      throw new Error(`Failed to load schema ${schemaFileName}: ${error.message}`);
    }
  }

  /**
   * Validate a section file against its appropriate schema
   */
  validateSectionFile(filePath) {
    const result = {
      file: path.basename(filePath),
      path: filePath,
      valid: false,
      errors: [],
      warnings: [],
      schema_used: null,
      section_info: {}
    };

    try {
      // Read and parse the section file
      const content = fs.readFileSync(filePath, 'utf8');
      const sectionData = JSON.parse(content);

      // Extract section tag to determine which schema to use
      const sectionTag = sectionData.tag;
      if (!sectionTag) {
        result.errors.push('Section file missing required \"tag\" property');
        return result;
      }

      // Find the appropriate schema
      const schemaFileName = this.schemaIndex[sectionTag];
      if (!schemaFileName) {
        result.errors.push(`No schema found for section tag: \"${sectionTag}\"`);
        result.warnings.push(`Available schemas: ${Object.keys(this.schemaIndex).join(', ')}`);
        return result;
      }

      // Load and validate against the specific schema
      const schema = this.loadSchema(schemaFileName);
      result.schema_used = schemaFileName;
      
      // Perform validation
      const validationErrors = this.validateAgainstSchema(sectionData, schema);
      
      if (validationErrors.length === 0) {
        result.valid = true;
        // Extract section information
        result.section_info = {
          name: sectionData.name,
          tag: sectionData.tag,
          children_count: sectionData.children ? sectionData.children.length : 0,
          has_metadata: !!sectionData.metadata
        };
      } else {
        result.errors = validationErrors;
      }

    } catch (error) {
      result.errors.push(`Failed to process file: ${error.message}`);
    }

    return result;
  }

  /**
   * Basic JSON Schema validation implementation
   */
  validateAgainstSchema(data, schema) {
    const errors = [];

    // Validate required properties
    if (schema.required) {
      for (const prop of schema.required) {
        if (!(prop in data)) {
          errors.push(`Missing required property: ${prop}`);
        }
      }
    }

    // Validate properties
    if (schema.properties) {
      for (const [key, value] of Object.entries(data)) {
        if (schema.properties[key]) {
          const propErrors = this.validateProperty(value, schema.properties[key], key);
          errors.push(...propErrors);
        } else if (!schema.additionalProperties) {
          errors.push(`Unknown property: ${key}`);
        }
      }
    }

    return errors;
  }

  /**
   * Validate individual properties
   */
  validateProperty(value, schema, propertyName) {
    const errors = [];

    // Type validation
    if (schema.type) {
      if (schema.type === 'string' && typeof value !== 'string') {
        errors.push(`Property ${propertyName} must be a string`);
      } else if (schema.type === 'array' && !Array.isArray(value)) {
        errors.push(`Property ${propertyName} must be an array`);
      } else if (schema.type === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
        errors.push(`Property ${propertyName} must be an object`);
      }
    }

    // String validations
    if (typeof value === 'string' && schema.type === 'string') {
      if (schema.minLength && value.length < schema.minLength) {
        errors.push(`Property ${propertyName} must be at least ${schema.minLength} characters`);
      }
      if (schema.maxLength && value.length > schema.maxLength) {
        errors.push(`Property ${propertyName} must be at most ${schema.maxLength} characters`);
      }
      if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
        errors.push(`Property ${propertyName} does not match required pattern`);
      }
      if (schema.const && value !== schema.const) {
        errors.push(`Property ${propertyName} must equal \"${schema.const}\"`);
      }
      if (schema.enum && !schema.enum.includes(value)) {
        errors.push(`Property ${propertyName} must be one of: ${schema.enum.join(', ')}`);
      }
    }

    // Array validations
    if (Array.isArray(value) && schema.type === 'array') {
      if (schema.minItems && value.length < schema.minItems) {
        errors.push(`Property ${propertyName} must have at least ${schema.minItems} items`);
      }
      if (schema.maxItems && value.length > schema.maxItems) {
        errors.push(`Property ${propertyName} must have at most ${schema.maxItems} items`);
      }

      // Validate array items
      if (schema.items && schema.items.$ref) {
        // Reference validation (simplified)
        const refName = schema.items.$ref.split('/').pop();
        for (let i = 0; i < value.length; i++) {
          if (refName === 'child' || refName.includes('child')) {
            const childErrors = this.validateChild(value[i], `${propertyName}[${i}]`);
            errors.push(...childErrors);
          }
        }
      }
    }

    return errors;
  }

  /**
   * Validate child objects (simplified validation for common child structure)
   */
  validateChild(child, path) {
    const errors = [];

    if (!child.name || typeof child.name !== 'string') {
      errors.push(`${path}.name is required and must be a string`);
    }

    if (!child.description || typeof child.description !== 'string') {
      errors.push(`${path}.description is required and must be a string`);
    }

    if (child.bullet_points) {
      if (!Array.isArray(child.bullet_points)) {
        errors.push(`${path}.bullet_points must be an array`);
      } else if (child.bullet_points.length === 0) {
        errors.push(`${path}.bullet_points cannot be empty if present`);
      }
    }

    return errors;
  }

  /**
   * Validate all section files in a directory
   */
  validateDirectory(directory) {
    try {
      const files = fs.readdirSync(directory);
      const jsonFiles = files.filter(file => file.endsWith('.json') && 
        !file.includes('schema') && !file.includes('index'));

      console.log(`\\n🔍 Validating ${jsonFiles.length} section files in: ${directory}`);
      console.log('=' .repeat(80));

      for (const file of jsonFiles) {
        const filePath = path.join(directory, file);
        const result = this.validateSectionFile(filePath);
        this.validationResults.push(result);
        this.printFileResult(result);
      }

    } catch (error) {
      console.error(`Failed to read directory ${directory}:`, error.message);
    }
  }

  /**
   * Print validation result for a single file
   */
  printFileResult(result) {
    const status = result.valid ? '✅ VALID' : '❌ INVALID';
    const schemaInfo = result.schema_used ? ` (${result.schema_used})` : '';
    
    console.log(`\\n📄 ${result.file}${schemaInfo}`);
    console.log(`   Status: ${status}`);
    
    if (result.section_info.name) {
      console.log(`   Section: ${result.section_info.name} (${result.section_info.tag})`);
      console.log(`   Children: ${result.section_info.children_count}`);
      console.log(`   Metadata: ${result.section_info.has_metadata ? 'Yes' : 'No'}`);
    }

    if (result.errors.length > 0) {
      console.log('   ❌ Errors:');
      result.errors.forEach(error => console.log(`      - ${error}`));
    }

    if (result.warnings.length > 0) {
      console.log('   ⚠️  Warnings:');
      result.warnings.forEach(warning => console.log(`      - ${warning}`));
    }
  }

  /**
   * Generate summary report
   */
  generateSummaryReport() {
    const total = this.validationResults.length;
    const valid = this.validationResults.filter(r => r.valid).length;
    const invalid = total - valid;

    console.log('\\n' + '=' .repeat(80));
    console.log('📊 VALIDATION SUMMARY REPORT');
    console.log('=' .repeat(80));
    console.log(`Total Files: ${total}`);
    console.log(`Valid Files: ${valid} ✅`);
    console.log(`Invalid Files: ${invalid} ❌`);
    console.log(`Success Rate: ${total > 0 ? ((valid / total) * 100).toFixed(1) : 0}%`);

    // Schema usage statistics
    const schemaUsage = {};
    this.validationResults.forEach(result => {
      if (result.schema_used) {
        const schemaName = result.schema_used.replace('-section-schema.json', '');
        schemaUsage[schemaName] = (schemaUsage[schemaName] || 0) + 1;
      }
    });

    if (Object.keys(schemaUsage).length > 0) {
      console.log('\\n📋 Schema Usage:');
      Object.entries(schemaUsage).forEach(([schema, count]) => {
        console.log(`   ${schema}: ${count} file(s)`);
      });
    }

    // List invalid files
    const invalidFiles = this.validationResults.filter(r => !r.valid);
    if (invalidFiles.length > 0) {
      console.log('\\n❌ Files needing attention:');
      invalidFiles.forEach(result => {
        console.log(`   - ${result.file}: ${result.errors.length} error(s)`);
      });
    }

    console.log('\\n' + '=' .repeat(80));
  }

  /**
   * Display help information
   */
  static displayHelp() {
    console.log(`
📚 Section Schema Validator - Multi-Schema Edition

DESCRIPTION:
  Validates documentation section files against their specific schemas.
  Each section type (overview, getting-started, features, etc.) uses 
  a tailored schema with appropriate validation rules.

USAGE:
  node validate-all-sections.js [directory]     # Validate all JSON files in directory
  node validate-all-sections.js --file <path>  # Validate specific file
  node validate-all-sections.js --help         # Show this help

EXAMPLES:
  node validate-all-sections.js ../sections/   # Validate all files
  node validate-all-sections.js --file 01-overview.json
  node validate-all-sections.js .              # Validate current directory

SCHEMA MAPPING:
  Each section file's 'tag' property determines which schema is used:
  - overview → 01-overview-section-schema.json
  - getting-started → 02-getting-started-section-schema.json  
  - features → 03-features-section-schema.json
  - use-cases → 04-use-cases-section-schema.json
  - workflow → 05-workflow-section-schema.json
  - troubleshooting → 06-troubleshooting-section-schema.json
  - api-docs → 07-api-documentation-section-schema.json
  - security-compliance → 08-security-compliance-section-schema.json
  - administration → 09-administration-section-schema.json
  - integration → 10-integration-guide-section-schema.json
  - training-support → 11-training-support-section-schema.json
  - release-notes → 12-release-notes-section-schema.json

OUTPUT:
  - Individual file validation results with schema information
  - Summary report with statistics and invalid file listing
  - Error details and suggestions for fixes
    `);
  }
}

// CLI Interface
function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    MultiSectionValidator.displayHelp();
    return;
  }

  const validator = new MultiSectionValidator();

  if (args.includes('--file')) {
    const fileIndex = args.indexOf('--file') + 1;
    if (fileIndex >= args.length) {
      console.error('Error: --file option requires a file path');
      process.exit(1);
    }
    const filePath = args[fileIndex];
    const result = validator.validateSectionFile(filePath);
    validator.validationResults.push(result);
    validator.printFileResult(result);
  } else {
    const directory = args[0] || '.';
    validator.validateDirectory(directory);
  }

  validator.generateSummaryReport();

  // Exit with error code if validation failed
  const hasErrors = validator.validationResults.some(result => !result.valid);
  process.exit(hasErrors ? 1 : 0);
}

if (require.main === module) {
  main();
}

module.exports = MultiSectionValidator;