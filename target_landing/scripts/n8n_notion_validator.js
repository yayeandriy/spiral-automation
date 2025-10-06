/**
 * Compact N8N Notion API JSON Validator & Fixer
 * Single function for use in N8N workflows
 */

function validateAndFixNotionJson(jsonData) {
    const validBlockTypes = [
        'paragraph', 'heading_1', 'heading_2', 'heading_3',
        'bulleted_list_item', 'numbered_list_item', 'to_do', 'toggle',
        'code', 'quote', 'callout', 'image', 'video', 'file',
        'bookmark', 'equation', 'divider', 'table_of_contents',
        'breadcrumb', 'column_list', 'column', 'link_preview',
        'synced_block', 'template', 'link_to_page', 'table',
        'table_row', 'embed', 'pdf', 'audio'
    ];

    const validColors = [
        'default', 'gray', 'brown', 'orange', 'yellow', 'green',
        'blue', 'purple', 'pink', 'red', 'gray_background',
        'brown_background', 'orange_background', 'yellow_background',
        'green_background', 'blue_background', 'purple_background',
        'pink_background', 'red_background'
    ];

    const errors = [];
    const fixes = [];

    function addError(message, context) {
        errors.push({ message, context });
    }

    function addFix(message, context) {
        fixes.push({ message, context });
    }

    function isEmptyBlock(block) {
        if (!block || Object.keys(block).length === 0) return true;
        if (Object.keys(block).length === 1 && block.type) return true;
        if (block.type && block[block.type] && 
            typeof block[block.type] === 'object' && 
            Object.keys(block[block.type]).length === 0) return true;
        return false;
    }

    function fixRichTextItem(item) {
        if (!item || typeof item !== 'object') return null;
        
        let fixedItem = { ...item };
        
        if (!fixedItem.type) {
            fixedItem.type = 'text';
            addFix('Added missing type to rich text item');
        }
        
        if (!['text', 'mention', 'equation'].includes(fixedItem.type)) {
            fixedItem.type = 'text';
            addFix('Fixed invalid rich text type');
        }
        
        if (fixedItem.type === 'text') {
            if (!fixedItem.text) {
                fixedItem.text = { content: '' };
                addFix('Added missing text property');
            }
            if (!fixedItem.text.content && fixedItem.text.content !== '') {
                fixedItem.text.content = '';
                addFix('Added missing content');
            }
        }
        
        return fixedItem;
    }

    function fixRichTextBlock(block) {
        const blockType = block.type;
        let blockContent = block[blockType] || {};

        if (!blockContent.rich_text) {
            blockContent.rich_text = [];
            addFix(`Added missing rich_text array to ${blockType}`);
        }

        if (!Array.isArray(blockContent.rich_text)) {
            blockContent.rich_text = [];
            addFix(`Converted rich_text to array in ${blockType}`);
        }

        blockContent.rich_text = blockContent.rich_text
            .map(item => fixRichTextItem(item))
            .filter(item => item !== null);

        if (blockContent.rich_text.length === 0) {
            blockContent.rich_text = [{
                type: 'text',
                text: { content: '' }
            }];
            addFix(`Added default empty rich_text item to ${blockType}`);
        }

        if (blockContent.color && !validColors.includes(blockContent.color)) {
            delete blockContent.color;
            addFix(`Removed invalid color from ${blockType}`);
        }

        if (blockContent.children) {
            blockContent.children = processChildren(blockContent.children);
        }

        return { ...block, [blockType]: blockContent };
    }

    function validateAndFixBlock(block) {
        if (!block || typeof block !== 'object') return null;
        if (isEmptyBlock(block)) {
            addFix('Removed empty block');
            return null;
        }

        if (!block.type) {
            addError('Block missing type property');
            return null;
        }

        let fixedBlock = { ...block };

        // Fix invalid heading types
        if (['heading_4', 'heading_5', 'heading_6'].includes(block.type)) {
            const oldType = block.type;
            fixedBlock.type = 'heading_3';
            if (block[oldType]) {
                fixedBlock.heading_3 = block[oldType];
                delete fixedBlock[oldType];
                addFix(`Converted ${oldType} to heading_3`);
            }
        }

        if (!validBlockTypes.includes(fixedBlock.type)) {
            addError(`Invalid block type: ${fixedBlock.type}`);
            return null;
        }

        // Apply specific fixes based on block type
        switch (fixedBlock.type) {
            case 'paragraph':
            case 'heading_1':
            case 'heading_2':
            case 'heading_3':
            case 'bulleted_list_item':
            case 'numbered_list_item':
                fixedBlock = fixRichTextBlock(fixedBlock);
                break;
            
            case 'to_do':
                fixedBlock = fixRichTextBlock(fixedBlock);
                if (fixedBlock.to_do && fixedBlock.to_do.checked === undefined) {
                    fixedBlock.to_do.checked = false;
                    addFix('Added missing checked property to to_do');
                }
                break;
            
            case 'code':
                if (!fixedBlock.code) fixedBlock.code = {};
                if (!fixedBlock.code.rich_text) {
                    fixedBlock.code.rich_text = [{ type: 'text', text: { content: '' } }];
                    addFix('Added missing rich_text to code block');
                }
                break;
            
            case 'divider':
                fixedBlock.divider = {};
                break;
            
            case 'column_list':
                if (!fixedBlock.column_list) fixedBlock.column_list = {};
                if (!fixedBlock.column_list.children) {
                    fixedBlock.column_list.children = [];
                    addFix('Added missing children to column_list');
                }
                fixedBlock.column_list.children = processChildren(fixedBlock.column_list.children);
                break;
            
            case 'column':
                if (!fixedBlock.column) fixedBlock.column = {};
                if (!fixedBlock.column.children) {
                    fixedBlock.column.children = [];
                    addFix('Added missing children to column');
                }
                fixedBlock.column.children = processChildren(fixedBlock.column.children);
                break;
            
            default:
                if (!fixedBlock[fixedBlock.type]) {
                    fixedBlock[fixedBlock.type] = {};
                    addFix(`Added missing ${fixedBlock.type} property`);
                }
        }

        return fixedBlock;
    }

    function processChildren(children) {
        if (!Array.isArray(children)) return [];
        return children
            .map(child => validateAndFixBlock(child))
            .filter(child => child !== null);
    }

    function processItem(item) {
        if (!item || typeof item !== 'object') return null;

        if (item.data && item.data.children) {
            return {
                ...item,
                data: {
                    ...item.data,
                    children: processChildren(item.data.children)
                }
            };
        }

        if (item.children) {
            return {
                ...item,
                children: processChildren(item.children)
            };
        }

        return validateAndFixBlock(item);
    }

    // Process the data
    let fixedData;
    if (Array.isArray(jsonData)) {
        fixedData = jsonData.map(item => processItem(item)).filter(item => item !== null);
    } else {
        fixedData = processItem(jsonData);
    }

    return {
        isValid: errors.length === 0,
        errors: errors,
        fixes: fixes,
        fixedData: fixedData,
        summary: {
            totalErrors: errors.length,
            totalFixes: fixes.length,
            isFullyValid: errors.length === 0
        }
    };
}

// For N8N usage, you can call this function directly:
// const result = validateAndFixNotionJson($json);
// return result.fixedData;

// Example usage in N8N:
/*
// In a Function node:
const inputData = $json;
const result = validateAndFixNotionJson(inputData);

// Log the validation summary
console.log(`Validation complete: ${result.summary.totalFixes} fixes applied, ${result.summary.totalErrors} errors found`);

// Return the fixed data
return result.fixedData;
*/