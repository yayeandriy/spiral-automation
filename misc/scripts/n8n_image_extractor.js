// N8N JavaScript Code to extract all images from Notion blocks response
// This code parses JSON like blocks_response_sample.json and extracts image URLs into an array

// Loop over input items and extract all images
for (const item of $input.all()) {
  try {
    // Get the input data (assuming it's the blocks response JSON)
    const blocksData = item.json;
    
    // Initialize arrays to store extracted image data
    const images = [];
    const imageUrls = [];
    const imageDetails = [];
    
    // Debug logging
    console.log('Processing blocks data...');
    console.log('Input type:', typeof blocksData);
    console.log('Is array:', Array.isArray(blocksData));
    
    // Handle different input structures
    let blocks = [];
    
    // More detailed debugging
    console.log('Blocks data keys:', Object.keys(blocksData));
    console.log('First few characters:', JSON.stringify(blocksData).substring(0, 200));
    
    // Check if this is a single block object
    if (blocksData.type && blocksData.object === 'block') {
      // Single block object - wrap in array
      blocks = [blocksData];
      console.log('Detected: Single block object');
    } else if (Array.isArray(blocksData)) {
      // Direct array of blocks
      blocks = blocksData;
      console.log('Detected: Direct array of blocks');
    } else if (blocksData.results && Array.isArray(blocksData.results)) {
      // Notion API response format with results wrapper
      blocks = blocksData.results;
      console.log('Detected: Notion API format with results wrapper');
    } else if (blocksData.blocks && Array.isArray(blocksData.blocks)) {
      // Custom wrapper format
      blocks = blocksData.blocks;
      console.log('Detected: Custom wrapper format');
    } else {
      // Try to find any array property that looks like blocks
      const arrayKeys = Object.keys(blocksData).filter(key => Array.isArray(blocksData[key]));
      console.log('Found array keys:', arrayKeys);
      
      if (arrayKeys.length > 0) {
        // Use the first array we find
        blocks = blocksData[arrayKeys[0]];
        console.log(`Using array from key: ${arrayKeys[0]}`);
      } else {
        console.log('Available keys in input:', Object.keys(blocksData));
        console.log('Input structure:', {
          isArray: Array.isArray(blocksData),
          hasResults: 'results' in blocksData,
          hasBlocks: 'blocks' in blocksData,
          type: typeof blocksData,
          hasTypeProperty: 'type' in blocksData,
          hasObjectProperty: 'object' in blocksData
        });
        throw new Error(`Could not find blocks array in input data. Available keys: ${Object.keys(blocksData).join(', ')}`);
      }
    }
    
    console.log(`Found ${blocks.length} blocks to process`);
    
    // Additional validation
    if (blocks.length > 0) {
      console.log('First block structure:', {
        hasType: 'type' in blocks[0],
        type: blocks[0].type,
        hasId: 'id' in blocks[0],
        keys: Object.keys(blocks[0])
      });
      
      // Count how many image blocks we have
      const imageBlocks = blocks.filter(block => block.type === 'image');
      console.log(`Found ${imageBlocks.length} image blocks out of ${blocks.length} total blocks`);
      
      if (imageBlocks.length > 0) {
        console.log('First image block:', {
          id: imageBlocks[0].id,
          hasImageProperty: 'image' in imageBlocks[0],
          imageKeys: imageBlocks[0].image ? Object.keys(imageBlocks[0].image) : 'No image property'
        });
      }
      
      // Show all block types for debugging
      const blockTypes = blocks.map(block => block.type).reduce((acc, type) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
      console.log('Block types found:', blockTypes);
    }
    
    // Process each block looking for images
    blocks.forEach((block, index) => {
      try {
        // Check if this block is an image block
        if (block.type === 'image' && block.image) {
          console.log(`Processing image block at index ${index}`);
          const imageBlock = block.image;
          let imageUrl = null;
          let imageType = null;
          
          console.log('Image block structure:', {
            type: imageBlock.type,
            hasFile: 'file' in imageBlock,
            hasExternal: 'external' in imageBlock
          });
          
          // Handle different image types (file vs external)
          if (imageBlock.type === 'file' && imageBlock.file) {
            imageUrl = imageBlock.file.url;
            imageType = 'file';
            console.log('Found file type image:', imageUrl ? 'URL present' : 'No URL');
          } else if (imageBlock.type === 'external' && imageBlock.external) {
            imageUrl = imageBlock.external.url;
            imageType = 'external';
            console.log('Found external type image:', imageUrl ? 'URL present' : 'No URL');
          } else {
            console.log('Unknown image type or missing data:', imageBlock.type);
          }
          
          if (imageUrl) {
            // Extract filename from URL (for file type)
            let filename = null;
            if (imageType === 'file') {
              const urlParts = imageUrl.split('/');
              const filenameWithQuery = urlParts[urlParts.length - 1];
              filename = filenameWithQuery.split('?')[0]; // Remove query parameters
            }
            
            // Create detailed image object
            const imageDetail = {
              block_id: block.id,
              block_index: index,
              type: imageType,
              url: imageUrl,
              filename: filename,
              caption: imageBlock.caption || [],
              caption_text: imageBlock.caption?.map(c => c.plain_text || c.text?.content).join('') || '',
              created_time: block.created_time,
              last_edited_time: block.last_edited_time,
              expiry_time: imageBlock.file?.expiry_time || null,
              parent_id: block.parent_id
            };
            
            // Add to arrays
            images.push(imageDetail);
            imageUrls.push(imageUrl);
            imageDetails.push({
              url: imageUrl,
              filename: filename,
              caption: imageDetail.caption_text,
              type: imageType
            });
            
            console.log(`Found image ${images.length}: ${filename || 'external image'}`);
          }
        }
        
        // Also check for images in rich text content (embedded images in paragraphs, etc.)
        if (block.type === 'paragraph' || block.type === 'heading_1' || block.type === 'heading_2' || block.type === 'heading_3') {
          const textContent = block[block.type];
          if (textContent && textContent.text) { // Changed from rich_text to text
            textContent.text.forEach((richTextElement, textIndex) => {
              // Look for image URLs in links
              if (richTextElement.text && richTextElement.text.link && richTextElement.text.link.url) {
                const url = richTextElement.text.link.url;
                // Check if the URL appears to be an image (common image extensions)
                if (url.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)(\?|$)/i)) {
                  const imageDetail = {
                    block_id: block.id,
                    block_index: index,
                    text_index: textIndex,
                    type: 'embedded_link',
                    url: url,
                    filename: null,
                    caption: richTextElement.text.content || '',
                    caption_text: richTextElement.text.content || '',
                    created_time: block.created_time,
                    last_edited_time: block.last_edited_time,
                    parent_id: block.parent_id
                  };
                  
                  images.push(imageDetail);
                  imageUrls.push(url);
                  imageDetails.push({
                    url: url,
                    filename: null,
                    caption: imageDetail.caption_text,
                    type: 'embedded_link'
                  });
                  
                  console.log(`Found embedded image ${images.length}: ${url}`);
                }
              }
            });
          }
        }
        
      } catch (blockError) {
        console.error(`Error processing block ${index}:`, blockError.message);
        // Continue processing other blocks
      }
    });
    
    console.log(`Extraction complete. Found ${images.length} total images.`);
    
    // Clear original data and add extracted image data
    item.json = {};
    
    // Add different formats of the image data
    item.json.images = images;                    // Full detailed objects
    item.json.image_urls = imageUrls;             // Simple URL array
    item.json.image_details = imageDetails;       // Simplified objects
    
    // Add summary statistics
    item.json.total_images = images.length;
    item.json.file_images = images.filter(img => img.type === 'file').length;
    item.json.external_images = images.filter(img => img.type === 'external').length;
    item.json.embedded_images = images.filter(img => img.type === 'embedded_link').length;
    
    // Add metadata
    item.json.extracted_at = new Date().toISOString();
    item.json.extraction_version = "1.0";
    item.json.extraction_success = true;
    item.json.blocks_processed = blocks.length;
    
  } catch (error) {
    console.error('Error extracting images:', error.message);
    
    // Clear item and add error info
    item.json = {};
    item.json.images = [];
    item.json.image_urls = [];
    item.json.image_details = [];
    item.json.total_images = 0;
    item.json.file_images = 0;
    item.json.external_images = 0;
    item.json.embedded_images = 0;
    item.json.error = error.message;
    item.json.extraction_success = false;
    item.json.extracted_at = new Date().toISOString();
    item.json.extraction_version = "1.0";
    item.json.blocks_processed = 0;
  }
}

return $input.all();