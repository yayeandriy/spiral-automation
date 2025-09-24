// n8n code to convert title to tag format
// Converts title to lowercase and replaces spaces with dashes

// Get the title from the input data
const title = $input.first().json.title;

// Convert title to tag format:
// 1. Convert to lowercase
// 2. Replace spaces with dashes
// 3. Remove any special characters (optional)
// 4. Remove multiple consecutive dashes
const tag = title
  .toLowerCase()
  .replace(/\s+/g, '-')           // Replace one or more spaces with single dash
  .replace(/[^\w\-]/g, '')        // Remove special characters except letters, numbers, and dashes
  .replace(/-+/g, '-')            // Replace multiple dashes with single dash
  .replace(/^-+|-+$/g, '');       // Remove leading/trailing dashes

// Return the result
return {
  json: {
    ...($input.first().json),
    tag: tag
  }
};
