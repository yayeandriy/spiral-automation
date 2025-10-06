// ===============================================
// N8N JavaScript Code Node - Section to Notion Blocks Converter
// Converts individual section data to Notion API blocks format
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

// Content Processing Functions
// ===============================================

/**
 * Get section emoji based on section tag
 */
function getSectionEmoji(tag) {
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
    
    return emojiMap[tag] || '📄';
}

/**
 * Split long text into paragraphs for better readability
 */
function splitTextIntoParagraphs(text, maxLength = 500) {
    if (!text || text.length <= maxLength) {
        return [text];
    }
    
    // Split by sentences first
    const sentences = text.split(/(?<=[.!?])\s+/);
    const paragraphs = [];
    let currentParagraph = '';
    
    for (const sentence of sentences) {
        if ((currentParagraph + sentence).length <= maxLength) {
            currentParagraph += (currentParagraph ? ' ' : '') + sentence;
        } else {
            if (currentParagraph) {
                paragraphs.push(currentParagraph.trim());
            }
            currentParagraph = sentence;
        }
    }
    
    if (currentParagraph) {
        paragraphs.push(currentParagraph.trim());
    }
    
    return paragraphs.filter(p => p.trim().length > 0);
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
        if (!child || !child.name) {
            return;
        }
        
        // Add child name as H3 heading
        blocks.push(createHeading(child.name, 3));
        
        // Process child description
        if (child.description) {
            // Split long descriptions into multiple paragraphs for readability
            const paragraphs = splitTextIntoParagraphs(child.description, 600);
            
            paragraphs.forEach((paragraph, pIndex) => {
                blocks.push(createParagraph(paragraph));
                
                // Add small spacing between paragraphs (except last one)
                if (pIndex < paragraphs.length - 1) {
                    blocks.push(createParagraph(""));
                }
            });
        }
        
        // Add bullet points if available
        if (child.bullet_points && Array.isArray(child.bullet_points) && child.bullet_points.length > 0) {
            // Add a small spacing before bullet points
            if (child.description) {
                blocks.push(createParagraph(""));
            }
            
            // Add "Key Points:" as bold paragraph
            blocks.push({
                object: "block",
                type: "paragraph",
                paragraph: {
                    rich_text: createRichText("Key Points:", { bold: true }),
                    color: "default"
                }
            });
            
            // Add each bullet point as a bulleted list item
            child.bullet_points.forEach(bulletPoint => {
                if (bulletPoint && bulletPoint.trim()) {
                    blocks.push(createBulletedListItem(bulletPoint.trim()));
                }
            });
        }
        
        // Add spacing between children (except last one)
        if (index < children.length - 1) {
            blocks.push(createDivider());
        }
    });
    
    return blocks;
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
        let sectionData = null;
        
        // Try to extract section data from various possible locations
        if (item.json) {
            if (Array.isArray(item.json) && item.json[0]?.section) {
                sectionData = item.json[0].section;
            } else if (item.json.section) {
                sectionData = item.json.section;
            } else if (item.json.data?.section) {
                sectionData = item.json.data.section;
            } else if (item.json.result?.section) {
                sectionData = item.json.result.section;
            } else if (item.json.name && item.json.tag) {
                // Direct section format
                sectionData = item.json;
            }
        }
        
        if (!sectionData || !sectionData.name) {
            results.push({
                json: {
                    error: `No valid section data found in input item ${i}`,
                    input_structure: Object.keys(item.json || {}),
                    notion_blocks: { children: [] }
                }
            });
            continue;
        }
        
        // Initialize blocks array
        const allBlocks = [];
        
        // Add section title with emoji
        const sectionEmoji = getSectionEmoji(sectionData.tag);
        allBlocks.push(createHeading(`${sectionEmoji} ${sectionData.name}`, 1));
        
        // Add section description as callout if present
        if (sectionData.description) {
            allBlocks.push(createCallout(sectionData.description, "ℹ️", "blue_background"));
        }
        
        // Add divider after header
        allBlocks.push(createDivider());
        
        // Process section children/subsections
        if (sectionData.children && Array.isArray(sectionData.children)) {
            const childBlocks = convertChildrenToBlocks(sectionData.children);
            allBlocks.push(...childBlocks);
        }
        
        // Create final result structure compatible with Notion API
        const notionBlocks = {
            children: allBlocks.filter(block => block !== null)
        };
        
        // Calculate statistics
        const totalBulletPoints = sectionData.children ? 
            sectionData.children.reduce((sum, child) => 
                sum + (child.bullet_points ? child.bullet_points.length : 0), 0) : 0;
        
        const stats = {
            total_blocks: notionBlocks.children.length,
            children_processed: sectionData.children ? sectionData.children.length : 0,
            total_bullet_points: totalBulletPoints,
            section_name: sectionData.name,
            section_tag: sectionData.tag,
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
                    source_section: sectionData.name,
                    source_tag: sectionData.tag
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
