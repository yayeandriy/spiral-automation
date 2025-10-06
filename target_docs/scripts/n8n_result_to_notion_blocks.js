// ===============================================
// N8N JavaScript Code Node - Result to Notion Blocks Converter
// Converts documentation structure to Notion API blocks format
// ===============================================

// Helper Functions for Notion Block Creation
// ===============================================

/**
 * Create Notion rich text array
 */
function createRichText(text, annotations = {}) {
    if (!text || text.trim() === "") {
        return [];
    }
    
    return [{
        type: "text",
        text: {
            content: text.toString(),
            link: null
        },
        annotations: {
            bold: Boolean(annotations.bold),
            italic: Boolean(annotations.italic),
            strikethrough: Boolean(annotations.strikethrough),
            underline: Boolean(annotations.underline),
            code: Boolean(annotations.code),
            color: annotations.color || "default"
        },
        plain_text: text.toString(),
        href: null
    }];
}

/**
 * Create heading block (H1, H2, H3)
 */
function createHeading(text, level = 2) {
    if (!text) return null;
    
    const headingType = `heading_${Math.min(Math.max(level, 1), 3)}`;
    return {
        object: "block",
        type: headingType,
        [headingType]: {
            rich_text: createRichText(text, { bold: true }),
            color: "default",
            is_toggleable: false
        }
    };
}

/**
 * Create paragraph block
 */
function createParagraph(text) {
    if (!text || text.trim() === "") {
        return {
            object: "block",
            type: "paragraph",
            paragraph: {
                rich_text: [],
                color: "default"
            }
        };
    }
    
    return {
        object: "block",
        type: "paragraph",
        paragraph: {
            rich_text: createRichText(text),
            color: "default"
        }
    };
}

/**
 * Create bulleted list item
 */
function createBulletedListItem(text) {
    return {
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
            rich_text: createRichText(text),
            color: "default"
        }
    };
}

/**
 * Create numbered list item
 */
function createNumberedListItem(text) {
    return {
        object: "block",
        type: "numbered_list_item",
        numbered_list_item: {
            rich_text: createRichText(text),
            color: "default"
        }
    };
}

/**
 * Create callout block with icon
 */
function createCallout(text, emoji = "📋", color = "blue_background") {
    return {
        object: "block",
        type: "callout",
        callout: {
            rich_text: createRichText(text),
            icon: {
                type: "emoji",
                emoji: emoji
            },
            color: color
        }
    };
}

/**
 * Create divider block
 */
function createDivider() {
    return {
        object: "block",
        type: "divider",
        divider: {}
    };
}

/**
 * Create toggle block (collapsible section)
 */
function createToggle(text, children = []) {
    return {
        object: "block",
        type: "toggle",
        toggle: {
            rich_text: createRichText(text, { bold: true }),
            color: "default",
            children: children
        }
    };
}

// Content Processing Functions
// ===============================================

/**
 * Parse text content and detect list patterns
 */
function parseTextContent(text) {
    if (!text || typeof text !== 'string') {
        return { type: 'paragraph', content: text || '' };
    }
    
    // Clean the text
    const cleanText = text.trim();
    
    // Check for bullet points (various formats)
    if (cleanText.includes('•') || cleanText.includes('- ') || /^\s*[\*\-]\s/.test(cleanText)) {
        // Split by bullet symbols and filter empty items
        const bulletPoints = cleanText
            .split(/[•\-\*]|\n\s*[\-\*]\s/)
            .map(item => item.trim())
            .filter(item => item.length > 0 && !item.match(/^[\-\*\•]\s*$/));
            
        if (bulletPoints.length > 1) {
            return {
                type: 'bulleted_list',
                items: bulletPoints
            };
        }
    }
    
    // Check for numbered steps (emoji numbers or regular numbers)
    if (/[0-9]️⃣|^\s*\d+[\.\)]\s|\n\s*\d+[\.\)]\s/.test(cleanText)) {
        // Split by number patterns
        const numberedItems = cleanText
            .split(/[0-9]️⃣|\n?\s*\d+[\.\)]\s*/)
            .map(item => item.trim())
            .filter(item => item.length > 0 && !item.match(/^\d+[\.\)]\s*$/));
            
        if (numberedItems.length > 1) {
            return {
                type: 'numbered_list',
                items: numberedItems
            };
        }
    }
    
    // Check for arrow sequences (workflow steps)
    if (cleanText.includes('→') || cleanText.includes('->') || cleanText.includes(' → ')) {
        const steps = cleanText
            .split(/\s*[→\-]\s*>?\s*/)
            .map(item => item.trim())
            .filter(item => item.length > 0 && item !== '>' && item !== '→');
            
        if (steps.length > 1) {
            return {
                type: 'numbered_list',
                items: steps
            };
        }
    }
    
    // Check for line breaks with content (multi-line paragraph)
    if (cleanText.includes('\n')) {
        const lines = cleanText.split('\n').filter(line => line.trim());
        if (lines.length > 1) {
            // Check if it's a list format
            const firstLine = lines[0].trim();
            if (/^[\-\*•]\s/.test(firstLine) || /^\d+[\.\)]\s/.test(firstLine)) {
                // It's a list, let the individual line processing handle it
                return { type: 'paragraph', content: cleanText };
            }
        }
    }
    
    // Regular paragraph
    return {
        type: 'paragraph',
        content: cleanText
    };
}

/**
 * Convert section children to Notion blocks
 */
function convertChildrenToBlocks(children) {
    if (!Array.isArray(children)) {
        return [];
    }
    
    const blocks = [];
    
    children.forEach((child, index) => {
        if (!child) {
            return;
        }
        
        let title = '';
        let content = '';
        
        // Handle new object structure with name/description properties
        if (typeof child === 'object' && child.name && child.description) {
            title = child.name;
            content = child.description;
        }
        // Handle legacy object structure with name/content properties
        else if (typeof child === 'object' && child.name && child.content) {
            title = child.name;
            content = child.content;
        }
        // Handle legacy string format with colon separator
        else if (typeof child === 'string') {
            const colonIndex = child.indexOf(':');
            if (colonIndex > 0 && colonIndex < 100) {
                title = child.substring(0, colonIndex).trim();
                content = child.substring(colonIndex + 1).trim();
            } else {
                content = child;
            }
        }
        // Handle array of issues/solutions (troubleshooting section)
        else if (Array.isArray(child)) {
            child.forEach(item => {
                if (item.issue && item.solution) {
                    blocks.push(createHeading(`Issue: ${item.issue}`, 3));
                    blocks.push(createParagraph(`Solution: ${item.solution}`));
                } else if (item.code && item.message && item.steps) {
                    blocks.push(createHeading(`Error ${item.code}`, 3));
                    blocks.push(createParagraph(`Message: ${item.message}`));
                    blocks.push(createParagraph(`Steps: ${item.steps}`));
                }
            });
            return;
        }
        else {
            // Unknown format, skip
            return;
        }
        
        // Add title as H3 heading if present
        if (title) {
            blocks.push(createHeading(title, 3));
        }
        
        // Process content if present
        if (content) {
            // Handle different content types
            if (Array.isArray(content)) {
                // Content is an array (like troubleshooting items)
                content.forEach(item => {
                    if (typeof item === 'object') {
                        if (item.issue && item.solution) {
                            blocks.push(createHeading(`Issue: ${item.issue}`, 4));
                            blocks.push(createParagraph(`Solution: ${item.solution}`));
                        } else if (item.code && item.message && item.steps) {
                            blocks.push(createHeading(`Error ${item.code}`, 4));
                            blocks.push(createParagraph(`Message: ${item.message}`));
                            blocks.push(createParagraph(`Steps: ${item.steps}`));
                        }
                    } else {
                        blocks.push(createParagraph(item.toString()));
                    }
                });
            } else {
                // Regular text content
                const contentStr = content.toString();
                const parsed = parseTextContent(contentStr);
                
                switch (parsed.type) {
                    case 'bulleted_list':
                        parsed.items.forEach(item => {
                            if (item.trim()) {
                                blocks.push(createBulletedListItem(item));
                            }
                        });
                        break;
                        
                    case 'numbered_list':
                        parsed.items.forEach(item => {
                            if (item.trim()) {
                                blocks.push(createNumberedListItem(item));
                            }
                        });
                        break;
                        
                    default:
                        // Handle multi-line content by splitting on newlines
                        const lines = contentStr.split('\n').filter(line => line.trim());
                        if (lines.length > 1) {
                            lines.forEach(line => {
                                const lineContent = line.trim();
                                if (lineContent) {
                                    // Check if line starts with bullet or number
                                    if (/^[-*•]\s/.test(lineContent)) {
                                        blocks.push(createBulletedListItem(lineContent.replace(/^[-*•]\s/, '')));
                                    } else if (/^\d+[\.\)]\s/.test(lineContent)) {
                                        blocks.push(createNumberedListItem(lineContent.replace(/^\d+[\.\)]\s/, '')));
                                    } else {
                                        blocks.push(createParagraph(lineContent));
                                    }
                                }
                            });
                        } else {
                            blocks.push(createParagraph(contentStr));
                        }
                }
            }
        }
        
        // Add spacing between major sections
        if (index < children.length - 1) {
            blocks.push(createParagraph(""));
        }
    });
    
    return blocks;
}

/**
 * Get section emoji based on section name/tag
 */
function getSectionEmoji(name, tag) {
    const emojiMap = {
        'overview': '🏠',
        'getting-started': '🚀',
        'features': '⚡',
        'use-cases': '💼',
        'workflow': '🔄',
        'troubleshooting': '🔧',
        'api-docs': '📡',
        'security-compliance': '🔒',
        'administration': '⚙️',
        'integration': '🔗',
        'training-support': '🎓',
        'release-notes': '📋'
    };
    
    return emojiMap[tag] || emojiMap[name.toLowerCase().replace(/[^a-z]/g, '-')] || '📄';
}

// Main N8N Execution Code
// ===============================================

try {
    // Get input data from previous n8n node
    const inputData = $input.all();
    
    if (!inputData || inputData.length === 0) {
        return [{
            json: {
                error: "No input data received",
                notion_blocks: { children: [] }
            }
        }];
    }
    
    const results = [];
    
    // Process each input item
    for (let i = 0; i < inputData.length; i++) {
        const item = inputData[i];
        let sourceData = null;
        
        // Try to extract sections data from various possible locations
        if (item.json) {
            if (Array.isArray(item.json) && item.json[0]?.sections) {
                sourceData = item.json[0];
            } else if (item.json.sections) {
                sourceData = item.json;
            } else if (item.json.data?.sections) {
                sourceData = item.json.data;
            } else if (item.json.result?.sections) {
                sourceData = item.json.result;
            }
        }
        
        if (!sourceData?.sections) {
            results.push({
                json: {
                    error: `No sections found in input item ${i}`,
                    input_structure: Object.keys(item.json || {}),
                    notion_blocks: { children: [] }
                }
            });
            continue;
        }
        
        // Initialize blocks array
        const allBlocks = [];
        
        // Add main documentation title
        allBlocks.push(createHeading("📚 Product Documentation", 1));
        allBlocks.push(createParagraph("Comprehensive documentation covering all aspects of the product, from getting started to advanced features and integrations."));
        allBlocks.push(createDivider());
        
        // Process each documentation section
        sourceData.sections.forEach((section, sectionIndex) => {
            if (!section.name) return;
            
            // Add section heading with emoji
            const sectionEmoji = getSectionEmoji(section.name, section.tag);
            allBlocks.push(createHeading(`${sectionEmoji} ${section.name}`, 2));
            
            // Process section children/content (no section description callout)
            if (section.children && Array.isArray(section.children)) {
                const childBlocks = convertChildrenToBlocks(section.children);
                allBlocks.push(...childBlocks);
            }
            
            // Add divider between sections (except last one)
            if (sectionIndex < sourceData.sections.length - 1) {
                allBlocks.push(createDivider());
            }
        });
        
        // Create final result structure compatible with Notion API
        const notionBlocks = {
            children: allBlocks.filter(block => block !== null)
        };
        
        // Calculate statistics
        const stats = {
            total_blocks: notionBlocks.children.length,
            sections_processed: sourceData.sections.length,
            block_types: {}
        };
        
        // Count block types
        notionBlocks.children.forEach(block => {
            const type = block.type;
            stats.block_types[type] = (stats.block_types[type] || 0) + 1;
        });
        
        // Add processed result
        results.push({
            json: {
                notion_blocks: notionBlocks,
                statistics: stats,
                processing_info: {
                    input_item_index: i,
                    timestamp: new Date().toISOString(),
                    source_sections: sourceData.sections.length
                }
            }
        });
    }
    
    return results;
    
} catch (error) {
    // Error handling for n8n
    return [{
        json: {
            error: `Processing failed: ${error.message}`,
            error_details: error.stack,
            notion_blocks: { children: [] }
        }
    }];
}