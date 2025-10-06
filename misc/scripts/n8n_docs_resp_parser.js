// N8N JavaScript Code to parse docs_resp.txt into JSON
// This code extracts the JSON content from the "output" field 

// Loop over input items and convert them to clean parsed JSON
for (const item of $input.all()) {
  try {
    // Get the input data (assuming it's the docs_resp content)
    const docsRespData = item.json;
    
    // Initialize result object
    let parsedData = null;
    let outputContent = null;
    
    // Debug: Log input structure
    console.log('Input data type:', typeof docsRespData);
    console.log('Input is array:', Array.isArray(docsRespData));
    
    // Check if the input is an array (as in docs_resp.txt)
    if (Array.isArray(docsRespData)) {
      // Get the first item's output field
      outputContent = docsRespData[0]?.output;
    } else if (docsRespData.output) {
      // Handle case where input is directly the object with output field
      outputContent = docsRespData.output;
    } else if (typeof docsRespData === 'string') {
      // Handle case where input is a string
      outputContent = docsRespData;
    } else {
      // Assume the input is already the parsed JSON
      parsedData = docsRespData;
    }
    
    if (outputContent && !parsedData) {
      console.log('Processing output content, length:', outputContent.length);
      
      // Try multiple patterns to extract JSON content
      let jsonMatch = null;
      
      // Pattern 1: Look for ```json blocks
      jsonMatch = outputContent.match(/```json\s*\n([\s\S]*?)\n```/);
      
      // Pattern 2: Look for any code block that contains JSON-like content
      if (!jsonMatch) {
        jsonMatch = outputContent.match(/```\w*\s*\n(\{[\s\S]*?\})\n```/);
      }
      
      // Pattern 3: Look for JSON without code blocks
      if (!jsonMatch) {
        jsonMatch = outputContent.match(/(\{[\s\S]*\})/);
        if (jsonMatch) {
          jsonMatch[1] = jsonMatch[1].trim();
        }
      }
      
      if (jsonMatch && jsonMatch[1]) {
        try {
          console.log('Found JSON match, attempting to parse...');
          // Parse the extracted JSON string
          parsedData = JSON.parse(jsonMatch[1].trim());
          console.log('Successfully parsed JSON');
        } catch (parseError) {
          console.error('JSON parse error:', parseError.message);
          throw new Error(`Failed to parse JSON: ${parseError.message}`);
        }
      } else {
        throw new Error('No JSON block found in output content. Searched for ```json blocks and raw JSON.');
      }
    }
    
    // Ensure we have parsed data
    if (!parsedData) {
      throw new Error('No valid data found to parse');
    }
    
    // Clear the original item and replace with clean parsed data
    item.json = {};
    
    // Structure the data to match what the Notion converter expects
    // Based on docs_output.json structure: array with sections property containing nested array
    if (parsedData.sections) {
      item.json.sections = [parsedData.sections]; // Wrap in array to match expected structure
      item.json.total_sections = parsedData.sections.length;
    } else {
      item.json.sections = [[]]; // Empty nested array structure
      item.json.total_sections = 0;
    }
    
    // Add metadata
    item.json.processed_at = new Date().toISOString();
    item.json.parser_version = "2.0";
    item.json.parsing_success = true;
    
    // Debug: log the final structure
    console.log('Final output structure:', {
      sections_is_array: Array.isArray(item.json.sections),
      sections_length: item.json.sections.length,
      first_section_is_array: Array.isArray(item.json.sections[0]),
      first_section_length: item.json.sections[0]?.length || 0
    });
    
  } catch (error) {
    // Handle errors gracefully - clear item and add error info
    item.json = {};
    item.json.error = error.message;
    item.json.sections = [[]]; // Match the nested array structure even for errors
    item.json.total_sections = 0;
    item.json.parsing_success = false;
    item.json.processed_at = new Date().toISOString();
    item.json.parser_version = "2.0";
    
    console.error('Error parsing docs_resp:', error.message);
  }
}

return $input.all();