/**
 * Notion API JSON Validator and Fixer
 * Validates and automatically fixes common issues in Notion API block structures
 */

class NotionBlockValidator {
    constructor() {
        this.validBlockTypes = [
            'paragraph', 'heading_1', 'heading_2', 'heading_3',
            'bulleted_list_item', 'numbered_list_item', 'to_do', 'toggle',
            'code', 'quote', 'callout', 'image', 'video', 'file',
            'bookmark', 'equation', 'divider', 'table_of_contents',
            'breadcrumb', 'column_list', 'column', 'link_preview',
            'synced_block', 'template', 'link_to_page', 'table',
            'table_row', 'embed', 'pdf', 'audio'
        ];

        this.validColors = [
            'default', 'gray', 'brown', 'orange', 'yellow', 'green',
            'blue', 'purple', 'pink', 'red', 'gray_background',
            'brown_background', 'orange_background', 'yellow_background',
            'green_background', 'blue_background', 'purple_background',
            'pink_background', 'red_background'
        ];

        this.errors = [];
        this.fixes = [];
    }

    /**
     * Validates and fixes a Notion JSON structure
     * @param {Object|Array} data - The JSON data to validate
     * @returns {Object} - Validation results and fixed data
     */
    validateAndFix(data) {
        this.errors = [];
        this.fixes = [];

        let fixedData;
        
        if (Array.isArray(data)) {
            fixedData = data.map(item => this.processItem(item));
        } else {
            fixedData = this.processItem(data);
        }

        return {
            isValid: this.errors.length === 0,
            errors: this.errors,
            fixes: this.fixes,
            fixedData: fixedData
        };
    }

    /**
     * Processes a single item in the JSON structure
     */
    processItem(item) {
        if (!item || typeof item !== 'object') {
            this.addError('Invalid item: not an object', item);
            return null;
        }

        // Handle root data structure
        if (item.data && item.data.children) {
            return {
                ...item,
                data: {
                    ...item.data,
                    children: this.processChildren(item.data.children)
                }
            };
        }

        // Handle direct children array
        if (item.children) {
            return {
                ...item,
                children: this.processChildren(item.children)
            };
        }

        // Handle individual block
        return this.validateAndFixBlock(item);
    }

    /**
     * Processes an array of children blocks
     */
    processChildren(children) {
        if (!Array.isArray(children)) {
            this.addError('Children must be an array', children);
            return [];
        }

        return children
            .map(child => this.validateAndFixBlock(child))
            .filter(child => child !== null);
    }

    /**
     * Validates and fixes a single block
     */
    validateAndFixBlock(block) {
        if (!block || typeof block !== 'object') {
            this.addError('Block is not a valid object', block);
            return null;
        }

        // Check if block is empty (only has empty objects as children)
        if (this.isEmptyBlock(block)) {
            this.addFix('Removed empty block', block);
            return null;
        }

        // Validate block type
        if (!block.type) {
            this.addError('Block missing type property', block);
            return null;
        }

        if (!this.validBlockTypes.includes(block.type)) {
            // Try to fix common invalid block types
            if (block.type === 'heading_4' || block.type === 'heading_5' || block.type === 'heading_6') {
                // Convert to heading_3 (deepest supported heading)
                const oldType = block.type;
                block.type = 'heading_3';
                
                // Convert the block content
                if (block[oldType]) {
                    block.heading_3 = block[oldType];
                    delete block[oldType];
                    this.addFix(`Converted ${oldType} to heading_3`, block);
                }
            } else {
                this.addError(`Invalid block type: ${block.type}`, block);
                return null;
            }
        }

        let fixedBlock = { ...block };

        // Validate and fix specific block types
        switch (block.type) {
            case 'paragraph':
            case 'heading_1':
            case 'heading_2':
            case 'heading_3':
                fixedBlock = this.fixRichTextBlock(fixedBlock);
                break;
            case 'bulleted_list_item':
            case 'numbered_list_item':
                fixedBlock = this.fixListItem(fixedBlock);
                break;
            case 'to_do':
                fixedBlock = this.fixToDoBlock(fixedBlock);
                break;
            case 'code':
                fixedBlock = this.fixCodeBlock(fixedBlock);
                break;
            case 'callout':
                fixedBlock = this.fixCalloutBlock(fixedBlock);
                break;
            case 'image':
                fixedBlock = this.fixImageBlock(fixedBlock);
                break;
            case 'divider':
                fixedBlock = this.fixDividerBlock(fixedBlock);
                break;
            case 'column_list':
                fixedBlock = this.fixColumnList(fixedBlock);
                break;
            case 'column':
                fixedBlock = this.fixColumn(fixedBlock);
                break;
            default:
                // For other block types, ensure basic structure
                if (!fixedBlock[block.type]) {
                    fixedBlock[block.type] = {};
                    this.addFix(`Added missing ${block.type} property`, block);
                }
        }

        return fixedBlock;
    }

    /**
     * Checks if a block is effectively empty
     */
    isEmptyBlock(block) {
        // Check for completely empty objects
        if (Object.keys(block).length === 0) {
            return true;
        }

        // Check for blocks with only type but no content
        if (Object.keys(block).length === 1 && block.type) {
            return true;
        }

        // Check for blocks with empty block-specific properties
        if (block.type && block[block.type]) {
            const blockContent = block[block.type];
            if (typeof blockContent === 'object' && Object.keys(blockContent).length === 0) {
                return true;
            }
        }

        return false;
    }

    /**
     * Fixes rich text blocks (paragraph, headings)
     */
    fixRichTextBlock(block) {
        const blockType = block.type;
        let blockContent = block[blockType] || {};

        // Ensure rich_text exists and is valid
        if (!blockContent.rich_text) {
            blockContent.rich_text = [];
            this.addFix(`Added missing rich_text array to ${blockType}`, block);
        }

        if (!Array.isArray(blockContent.rich_text)) {
            blockContent.rich_text = [];
            this.addFix(`Converted rich_text to array in ${blockType}`, block);
        }

        // Validate and fix rich text items
        blockContent.rich_text = blockContent.rich_text
            .map(item => this.fixRichTextItem(item))
            .filter(item => item !== null);

        // If empty rich_text, add default content
        if (blockContent.rich_text.length === 0) {
            blockContent.rich_text = [{
                type: 'text',
                text: { content: '' }
            }];
            this.addFix(`Added default empty rich_text item to ${blockType}`, block);
        }

        // Validate color if present
        if (blockContent.color && !this.validColors.includes(blockContent.color)) {
            delete blockContent.color;
            this.addFix(`Removed invalid color from ${blockType}`, block);
        }

        // Process children if they exist
        if (blockContent.children) {
            blockContent.children = this.processChildren(blockContent.children);
        }

        return {
            ...block,
            [blockType]: blockContent
        };
    }

    /**
     * Fixes rich text items
     */
    fixRichTextItem(item) {
        if (!item || typeof item !== 'object') {
            this.addError('Rich text item is not a valid object', item);
            return null;
        }

        let fixedItem = { ...item };

        // Ensure type exists
        if (!fixedItem.type) {
            fixedItem.type = 'text';
            this.addFix('Added missing type to rich text item', item);
        }

        // Validate type
        if (!['text', 'mention', 'equation'].includes(fixedItem.type)) {
            fixedItem.type = 'text';
            this.addFix('Fixed invalid rich text type', item);
        }

        // For text type, ensure text property exists
        if (fixedItem.type === 'text') {
            if (!fixedItem.text) {
                fixedItem.text = { content: '' };
                this.addFix('Added missing text property to rich text item', item);
            }

            if (!fixedItem.text.content && fixedItem.text.content !== '') {
                fixedItem.text.content = '';
                this.addFix('Added missing content to text property', item);
            }
        }

        // Validate annotations if present
        if (fixedItem.annotations) {
            fixedItem.annotations = this.fixAnnotations(fixedItem.annotations);
        }

        return fixedItem;
    }

    /**
     * Fixes annotations object
     */
    fixAnnotations(annotations) {
        const validKeys = ['bold', 'italic', 'strikethrough', 'underline', 'code', 'color'];
        let fixedAnnotations = {};

        validKeys.forEach(key => {
            if (annotations[key] !== undefined) {
                if (key === 'color') {
                    if (this.validColors.includes(annotations[key])) {
                        fixedAnnotations[key] = annotations[key];
                    }
                } else {
                    fixedAnnotations[key] = Boolean(annotations[key]);
                }
            }
        });

        return Object.keys(fixedAnnotations).length > 0 ? fixedAnnotations : undefined;
    }

    /**
     * Fixes list items
     */
    fixListItem(block) {
        const fixedBlock = this.fixRichTextBlock(block);
        
        // List items can have children
        const blockType = block.type;
        if (fixedBlock[blockType].children) {
            fixedBlock[blockType].children = this.processChildren(fixedBlock[blockType].children);
        }

        return fixedBlock;
    }

    /**
     * Fixes to-do blocks
     */
    fixToDoBlock(block) {
        let fixedBlock = this.fixRichTextBlock(block);
        
        // Ensure checked property exists
        if (fixedBlock.to_do.checked === undefined) {
            fixedBlock.to_do.checked = false;
            this.addFix('Added missing checked property to to_do block', block);
        }

        return fixedBlock;
    }

    /**
     * Fixes code blocks
     */
    fixCodeBlock(block) {
        let blockContent = block.code || {};

        // Ensure rich_text exists
        if (!blockContent.rich_text) {
            blockContent.rich_text = [{
                type: 'text',
                text: { content: '' }
            }];
            this.addFix('Added missing rich_text to code block', block);
        }

        // Validate language if present
        const validLanguages = [
            'javascript', 'typescript', 'python', 'java', 'c', 'cpp',
            'csharp', 'php', 'ruby', 'go', 'rust', 'kotlin', 'swift',
            'html', 'css', 'sql', 'shell', 'powershell', 'dockerfile',
            'yaml', 'json', 'xml', 'markdown', 'plain_text'
        ];

        if (blockContent.language && !validLanguages.includes(blockContent.language)) {
            blockContent.language = 'plain_text';
            this.addFix('Fixed invalid language in code block', block);
        }

        return {
            ...block,
            code: blockContent
        };
    }

    /**
     * Fixes callout blocks
     */
    fixCalloutBlock(block) {
        let fixedBlock = this.fixRichTextBlock(block);
        
        // Icon is optional but if present should be valid
        if (fixedBlock.callout.icon) {
            fixedBlock.callout.icon = this.fixIcon(fixedBlock.callout.icon);
        }

        return fixedBlock;
    }

    /**
     * Fixes icon objects
     */
    fixIcon(icon) {
        if (!icon.type || !['emoji', 'external', 'file'].includes(icon.type)) {
            return { type: 'emoji', emoji: '💡' };
        }
        return icon;
    }

    /**
     * Fixes image blocks
     */
    fixImageBlock(block) {
        let blockContent = block.image || {};

        if (!blockContent.type) {
            blockContent.type = 'external';
            this.addFix('Added missing type to image block', block);
        }

        if (!['file', 'external'].includes(blockContent.type)) {
            blockContent.type = 'external';
            this.addFix('Fixed invalid image type', block);
        }

        return {
            ...block,
            image: blockContent
        };
    }

    /**
     * Fixes divider blocks
     */
    fixDividerBlock(block) {
        return {
            ...block,
            divider: {}
        };
    }

    /**
     * Fixes column list blocks
     */
    fixColumnList(block) {
        let blockContent = block.column_list || {};

        if (!blockContent.children) {
            blockContent.children = [];
            this.addFix('Added missing children to column_list', block);
        }

        // Process column children
        blockContent.children = this.processChildren(blockContent.children);

        return {
            ...block,
            column_list: blockContent
        };
    }

    /**
     * Fixes column blocks
     */
    fixColumn(block) {
        let blockContent = block.column || {};

        if (!blockContent.children) {
            blockContent.children = [];
            this.addFix('Added missing children to column', block);
        }

        // Process column children
        blockContent.children = this.processChildren(blockContent.children);

        return {
            ...block,
            column: blockContent
        };
    }

    /**
     * Adds an error to the errors array
     */
    addError(message, context) {
        this.errors.push({
            message,
            context: JSON.stringify(context, null, 2).substring(0, 200)
        });
    }

    /**
     * Adds a fix to the fixes array
     */
    addFix(message, context) {
        this.fixes.push({
            message,
            context: JSON.stringify(context, null, 2).substring(0, 200)
        });
    }

    /**
     * Validates that the final structure matches Notion API requirements
     */
    validateFinalStructure(data) {
        const errors = [];

        if (Array.isArray(data)) {
            data.forEach((item, index) => {
                if (item.data && item.data.children) {
                    if (!Array.isArray(item.data.children)) {
                        errors.push(`Item ${index}: data.children must be an array`);
                    }
                } else if (!item.type) {
                    errors.push(`Item ${index}: Missing block structure`);
                }
            });
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

/**
 * Main function to validate and fix Notion JSON
 */
function validateAndFixNotionJson(jsonData) {
    const validator = new NotionBlockValidator();
    const result = validator.validateAndFix(jsonData);
    
    // Additional structure validation
    const structureValidation = validator.validateFinalStructure(result.fixedData);
    
    return {
        ...result,
        structureValidation,
        summary: {
            totalErrors: result.errors.length,
            totalFixes: result.fixes.length,
            isFullyValid: result.isValid && structureValidation.isValid
        }
    };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        NotionBlockValidator,
        validateAndFixNotionJson
    };
}

// Example usage
if (typeof require !== 'undefined') {
    // Example: Load and validate a JSON file
    const fs = require('fs');
    const path = require('path');

    function processNotionJsonFile(filePath) {
        try {
            const jsonContent = fs.readFileSync(filePath, 'utf8');
            const jsonData = JSON.parse(jsonContent);
            
            console.log('🔍 Validating Notion JSON...');
            const result = validateAndFixNotionJson(jsonData);
            
            console.log('\n📊 Validation Results:');
            console.log(`- Errors found: ${result.summary.totalErrors}`);
            console.log(`- Fixes applied: ${result.summary.totalFixes}`);
            console.log(`- Fully valid: ${result.summary.isFullyValid}`);
            
            if (result.errors.length > 0) {
                console.log('\n❌ Errors:');
                result.errors.forEach((error, i) => {
                    console.log(`${i + 1}. ${error.message}`);
                });
            }
            
            if (result.fixes.length > 0) {
                console.log('\n🔧 Fixes applied:');
                result.fixes.forEach((fix, i) => {
                    console.log(`${i + 1}. ${fix.message}`);
                });
            }
            
            // Save fixed version
            if (result.fixes.length > 0) {
                const fixedFilePath = filePath.replace('.json', '_fixed.json');
                fs.writeFileSync(fixedFilePath, JSON.stringify(result.fixedData, null, 2));
                console.log(`\n💾 Fixed version saved to: ${fixedFilePath}`);
            }
            
            return result;
            
        } catch (error) {
            console.error('Error processing file:', error.message);
            return null;
        }
    }

    // If script is run directly with a file path argument
    if (process.argv.length > 2) {
        const filePath = process.argv[2];
        processNotionJsonFile(filePath);
    }
}