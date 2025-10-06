const fs = require('fs');

// Load the section.json data
const sectionData = JSON.parse(fs.readFileSync('/Users/pluton/Agents/spiral/projects/target_docs/data/section.json', 'utf8'));

// Mock the n8n $input global
global.$input = {
    all: () => [{
        json: sectionData[0]
    }]
};

// Include the n8n script content
const scriptContent = fs.readFileSync('/Users/pluton/Agents/spiral/projects/target_docs/scripts/section_to_blocks.js', 'utf8');

try {
    // Execute the script and capture the result
    const result = eval(`(() => { ${scriptContent} })()`);
    
    // Write output
    fs.writeFileSync('/Users/pluton/Agents/spiral/projects/target_docs/data/section_notion_blocks.json', JSON.stringify(result, null, 2));
    console.log('✅ Section script executed successfully!');
    console.log(`📊 Generated ${result[0].json.statistics.total_blocks} blocks`);
    console.log(`📋 Section: ${result[0].json.statistics.section_name}`);
    console.log('📁 Output saved to section_notion_blocks.json');
    
    // Show block type breakdown
    console.log('\n📋 Block Types:');
    Object.entries(result[0].json.statistics.block_types).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
    });
} catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
}