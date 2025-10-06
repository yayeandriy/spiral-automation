const fs = require('fs');
const path = require('path');

/**
 * JSON Schema Validator for Documentation Sections
 * Validates section JSON files against the defined schema
 */

// Simple JSON Schema validator (basic implementation)
class JSONSchemaValidator {
    constructor(schema) {
        this.schema = schema;
    }

    validate(data) {
        const errors = [];
        this._validateObject(data, this.schema, '', errors);
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    _validateObject(data, schema, path, errors) {
        // Check required properties
        if (schema.required) {
            schema.required.forEach(requiredProp => {
                if (!(requiredProp in data)) {
                    errors.push(`Missing required property: ${path}.${requiredProp}`);
                }
            });
        }

        // Validate each property
        if (schema.properties) {
            Object.keys(schema.properties).forEach(prop => {
                if (prop in data) {
                    const propPath = path ? `${path}.${prop}` : prop;
                    this._validateProperty(data[prop], schema.properties[prop], propPath, errors);
                }
            });
        }

        // Check for additional properties
        if (schema.additionalProperties === false) {
            const allowedProps = Object.keys(schema.properties || {});
            Object.keys(data).forEach(prop => {
                if (!allowedProps.includes(prop)) {
                    errors.push(`Additional property not allowed: ${path}.${prop}`);
                }
            });
        }
    }

    _validateProperty(value, schema, path, errors) {
        // Type validation
        if (schema.type) {
            const actualType = Array.isArray(value) ? 'array' : typeof value;
            if (actualType !== schema.type) {
                errors.push(`Type mismatch at ${path}: expected ${schema.type}, got ${actualType}`);
                return;
            }
        }

        // String validations
        if (schema.type === 'string') {
            if (schema.minLength && value.length < schema.minLength) {
                errors.push(`String too short at ${path}: minimum length is ${schema.minLength}`);
            }
            if (schema.maxLength && value.length > schema.maxLength) {
                errors.push(`String too long at ${path}: maximum length is ${schema.maxLength}`);
            }
            if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
                errors.push(`String does not match pattern at ${path}: ${schema.pattern}`);
            }
            if (schema.enum && !schema.enum.includes(value)) {
                errors.push(`Value not in enum at ${path}: must be one of ${schema.enum.join(', ')}`);
            }
        }

        // Array validations
        if (schema.type === 'array') {
            if (schema.minItems && value.length < schema.minItems) {
                errors.push(`Array too short at ${path}: minimum ${schema.minItems} items required`);
            }
            if (schema.maxItems && value.length > schema.maxItems) {
                errors.push(`Array too long at ${path}: maximum ${schema.maxItems} items allowed`);
            }
            if (schema.items) {
                value.forEach((item, index) => {
                    const itemPath = `${path}[${index}]`;
                    if (schema.items.$ref) {
                        // Handle $ref to definitions
                        const refPath = schema.items.$ref.replace('#/definitions/', '');
                        const refSchema = this.schema.definitions[refPath];
                        if (refSchema) {
                            this._validateProperty(item, refSchema, itemPath, errors);
                        }
                    } else {
                        this._validateProperty(item, schema.items, itemPath, errors);
                    }
                });
            }
        }

        // Object validations
        if (schema.type === 'object') {
            this._validateObject(value, schema, path, errors);
        }
    }
}

/**
 * Main validation function
 */
function validateSectionFile(filePath) {
    try {
        // Load the schema
        const schemaPath = path.join(__dirname, '..', 'schemas', 'section-schema.json');
        const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

        // Load the section file
        const sectionData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        // Validate
        const validator = new JSONSchemaValidator(schema);
        const result = validator.validate(sectionData);

        return {
            filePath: filePath,
            fileName: path.basename(filePath),
            valid: result.valid,
            errors: result.errors,
            sectionName: sectionData.name || 'Unknown',
            childrenCount: sectionData.children ? sectionData.children.length : 0
        };

    } catch (error) {
        return {
            filePath: filePath,
            fileName: path.basename(filePath),
            valid: false,
            errors: [`File processing error: ${error.message}`],
            sectionName: 'Unknown',
            childrenCount: 0
        };
    }
}

/**
 * Validate all section files in a directory
 */
function validateAllSections(sectionsDir) {
    const results = [];
    
    try {
        const files = fs.readdirSync(sectionsDir);
        const jsonFiles = files.filter(file => file.endsWith('.json') && file !== 'index.json');

        jsonFiles.forEach(file => {
            const filePath = path.join(sectionsDir, file);
            const result = validateSectionFile(filePath);
            results.push(result);
        });

    } catch (error) {
        console.error(`Error reading directory ${sectionsDir}:`, error.message);
    }

    return results;
}

/**
 * Generate validation report
 */
function generateReport(results) {
    const validFiles = results.filter(r => r.valid);
    const invalidFiles = results.filter(r => !r.valid);

    console.log('\n📋 Section Validation Report');
    console.log('='.repeat(50));
    console.log(`Total files processed: ${results.length}`);
    console.log(`✅ Valid files: ${validFiles.length}`);
    console.log(`❌ Invalid files: ${invalidFiles.length}`);

    if (validFiles.length > 0) {
        console.log('\n✅ Valid Sections:');
        validFiles.forEach(result => {
            console.log(`  ${result.fileName} - ${result.sectionName} (${result.childrenCount} children)`);
        });
    }

    if (invalidFiles.length > 0) {
        console.log('\n❌ Invalid Sections:');
        invalidFiles.forEach(result => {
            console.log(`\n  ${result.fileName} - ${result.sectionName}`);
            result.errors.forEach(error => {
                console.log(`    - ${error}`);
            });
        });
    }

    return {
        totalFiles: results.length,
        validFiles: validFiles.length,
        invalidFiles: invalidFiles.length,
        results: results
    };
}

// Export functions for use in other scripts
module.exports = {
    validateSectionFile,
    validateAllSections,
    generateReport,
    JSONSchemaValidator
};

// CLI usage
if (require.main === module) {
    const sectionsDir = process.argv[2] || path.join(__dirname, '..', 'sections');
    
    console.log(`🔍 Validating sections in: ${sectionsDir}`);
    const results = validateAllSections(sectionsDir);
    const report = generateReport(results);
    
    // Exit with error code if there are invalid files
    process.exit(report.invalidFiles > 0 ? 1 : 0);
}