#!/usr/bin/env node

/**
 * Simple CLI tool to validate and fix Notion API JSON files
 * Usage: node validate_notion.js <path-to-json-file>
 */

const { validateAndFixNotionJson } = require('./notion_api_validator_fixer.js');
const fs = require('fs');
const path = require('path');

function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Usage: node validate_notion.js <path-to-json-file>');
        console.log('Example: node validate_notion.js ../target_landing/results/landing.json');
        process.exit(1);
    }

    const filePath = args[0];
    
    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        process.exit(1);
    }

    try {
        console.log(`🔍 Processing: ${filePath}\n`);
        
        // Read the JSON file
        const jsonContent = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(jsonContent);
        
        // Validate and fix
        const result = validateAndFixNotionJson(jsonData);
        
        // Display results
        console.log('📊 VALIDATION RESULTS');
        console.log('═'.repeat(50));
        console.log(`Status: ${result.summary.isFullyValid ? '✅ VALID' : '⚠️  NEEDS FIXES'}`);
        console.log(`Errors found: ${result.summary.totalErrors}`);
        console.log(`Fixes applied: ${result.summary.totalFixes}`);
        
        if (result.errors.length > 0) {
            console.log('\n❌ ERRORS FOUND:');
            console.log('-'.repeat(30));
            result.errors.forEach((error, i) => {
                console.log(`${i + 1}. ${error.message}`);
                if (error.context) {
                    console.log(`   Context: ${error.context.substring(0, 100)}...`);
                }
            });
        }
        
        if (result.fixes.length > 0) {
            console.log('\n🔧 FIXES APPLIED:');
            console.log('-'.repeat(30));
            result.fixes.slice(0, 10).forEach((fix, i) => {
                console.log(`${i + 1}. ${fix.message}`);
            });
            
            if (result.fixes.length > 10) {
                console.log(`   ... and ${result.fixes.length - 10} more fixes`);
            }
            
            // Save fixed version
            const dir = path.dirname(filePath);
            const filename = path.basename(filePath, '.json');
            const fixedPath = path.join(dir, `${filename}_fixed.json`);
            
            fs.writeFileSync(fixedPath, JSON.stringify(result.fixedData, null, 2));
            console.log(`\n💾 Fixed version saved to: ${fixedPath}`);
        }
        
        // Structure validation results
        if (!result.structureValidation.isValid) {
            console.log('\n🏗️  STRUCTURE ISSUES:');
            console.log('-'.repeat(30));
            result.structureValidation.errors.forEach((error, i) => {
                console.log(`${i + 1}. ${error}`);
            });
        }
        
        console.log('\n✨ Processing complete!');
        
        // Exit code: 0 if fully valid, 1 if fixes were needed
        process.exit(result.summary.isFullyValid ? 0 : 1);
        
    } catch (error) {
        console.error(`❌ Error processing file: ${error.message}`);
        if (error instanceof SyntaxError) {
            console.error('   The file does not contain valid JSON');
        }
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}