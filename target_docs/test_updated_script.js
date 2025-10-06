const fs = require('fs');

// Load the updated overview section data
const overviewData = JSON.parse(fs.readFileSync('/Users/pluton/Agents/spiral/projects/target_docs/reqs/sections/01-overview.json', 'utf8'));

// Mock the n8n $input global
global.$input = {
    all: () => [{
        json: overviewData
    }]
};

// Include the n8n script content
const scriptContent = fs.readFileSync('/Users/pluton/Agents/spiral/projects/target_docs/scripts/section_to_blocks.js', 'utf8');

try {
    // Execute the script and capture the result
    const result = eval(`(() => { ${scriptContent} })()`);
    
    // Write output
    fs.writeFileSync('/Users/pluton/Agents/spiral/projects/target_docs/overview_with_bullets_output.json', JSON.stringify(result, null, 2));
    console.log('✅ Updated section script executed successfully!');
    console.log(`📊 Generated ${result[0].json.statistics.total_blocks} blocks`);
    console.log(`📋 Section: ${result[0].json.statistics.section_name}`);
    console.log(`🔸 Total bullet points: ${result[0].json.statistics.total_bullet_points}`);
    console.log('📁 Output saved to overview_with_bullets_output.json');
    
    // Show block type breakdown
    console.log('\n📋 Block Types:');
    Object.entries(result[0].json.statistics.block_types).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
    });
} catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
}