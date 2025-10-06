// N8N JavaScript Code to convert questions_sample.json into Notion blocks
// This code transforms questionnaire data into proper Notion block format

// Helper function to create rich text from plain text
function createRichText(text, annotations = {}) {
  if (!text) return [];
  
  return [{
    type: "text",
    text: {
      content: text
    },
    annotations: {
      bold: annotations.bold || false,
      italic: annotations.italic || false,
      strikethrough: annotations.strikethrough || false,
      underline: annotations.underline || false,
      code: annotations.code || false,
      color: annotations.color || "default"
    }
  }];
}

// Helper function to create a paragraph block
function createParagraphBlock(text, color = "default") {
  return {
    type: "paragraph",
    paragraph: {
      rich_text: createRichText(text),
      color: color
    }
  };
}

// Helper function to create heading blocks
function createHeadingBlock(text, level = 1, color = "default") {
  const headingType = `heading_${level}`;
  return {
    type: headingType,
    [headingType]: {
      rich_text: createRichText(text, { bold: true }),
      color: color
    }
  };
}

// Helper function to create numbered list items
function createNumberedListItem(text) {
  return {
    type: "numbered_list_item",
    numbered_list_item: {
      rich_text: createRichText(text)
    }
  };
}

// Helper function to create callout blocks
function createCalloutBlock(text, icon = "❓", color = "blue_background") {
  return {
    type: "callout",
    callout: {
      rich_text: createRichText(text),
      icon: {
        type: "emoji",
        emoji: icon
      },
      color: color
    }
  };
}

// Helper function to create divider
function createDivider() {
  return {
    type: "divider",
    divider: {}
  };
}

// Helper function to create to-do items (for options)
function createToDoItem(text, checked = false) {
  return {
    type: "to_do",
    to_do: {
      rich_text: createRichText(text),
      checked: checked
    }
  };
}

// Helper function to create bulleted list items
function createBulletedListItem(text) {
  return {
    type: "bulleted_list_item",
    bulleted_list_item: {
      rich_text: createRichText(text)
    }
  };
}

// Main conversion function
function convertQuestionsToNotionBlocks(questionsData) {
  const notionBlocks = [];
  
  try {
    // Handle different input structures
    let questions = [];
    
    if (Array.isArray(questionsData)) {
      // Direct array - check if first item has data.questions
      if (questionsData[0] && questionsData[0].data && questionsData[0].data.questions) {
        questions = questionsData[0].data.questions;
      } else {
        questions = questionsData;
      }
    } else if (questionsData.data && questionsData.data.questions) {
      // Object with data.questions structure
      questions = questionsData.data.questions;
    } else if (questionsData.questions) {
      // Direct questions array
      questions = questionsData.questions;
    } else {
      throw new Error('Could not find questions array in input data');
    }
    
    console.log(`Found ${questions.length} questions to convert`);
    
    // Process each question
    questions.forEach((question, questionIndex) => {
      try {
        const questionNumber = questionIndex + 1;
        
        // Add question as numbered list item with options as children
        const questionText = question.question_text || `Question ${question.question_id}`;
        
        // Create children array for the options
        const children = [];
        if (question.options && Array.isArray(question.options)) {
          question.options.forEach((option) => {
            const optionText = option.option_text || option.text || 'No text';
            children.push(createBulletedListItem(optionText));
          });
        }
        
        // Create numbered list item with children
        const questionBlock = {
          type: "numbered_list_item",
          numbered_list_item: {
            rich_text: createRichText(questionText),
            children: children
          }
        };
        
        notionBlocks.push(questionBlock);
        
        console.log(`Processed question ${questionNumber}: ${questionText.substring(0, 50)}...`);
        
      } catch (questionError) {
        console.error(`Error processing question ${questionIndex + 1}:`, questionError.message);
        
        // Add error as numbered list item
        notionBlocks.push(createNumberedListItem(`Error processing question ${questionIndex + 1}: ${questionError.message}`));
      }
    });
    
    return notionBlocks;
    
  } catch (error) {
    console.error('Error converting questions to Notion blocks:', error);
    return [
      createNumberedListItem(`Error processing questionnaire: ${error.message}`)
    ];
  }
}

// N8N execution context
// Loop over input items and convert each one
for (const item of $input.all()) {
  try {
    const questionsData = item.json;
    const notionBlocks = convertQuestionsToNotionBlocks(questionsData);
    
    // Clear original data and add converted blocks
    item.json = {};
    
    // Add the converted blocks in Notion API format
    item.json.children = notionBlocks;
    item.json.block_count = notionBlocks.length;
    item.json.conversion_timestamp = new Date().toISOString();
    item.json.conversion_status = "success";
    
    // Add summary statistics
    const questionBlocks = notionBlocks.filter(block => block.type === 'numbered_list_item');
    const optionBlocks = notionBlocks.filter(block => block.type === 'bulleted_list_item');
    
    item.json.summary = {
      total_blocks: notionBlocks.length,
      questions_converted: questionBlocks.length,
      options_converted: optionBlocks.length
    };
    
    console.log(`Successfully converted questionnaire with ${questionBlocks.length} questions and ${optionBlocks.length} options`);
    
  } catch (error) {
    console.error('Error in N8N conversion:', error);
    
    // Clear item and add error info
    item.json = {};
    item.json.children = [
      {
        type: "numbered_list_item",
        numbered_list_item: {
          rich_text: [{
            type: "text",
            text: {
              content: `Error converting questionnaire: ${error.message}`
            }
          }]
        }
      }
    ];
    item.json.block_count = 1;
    item.json.conversion_status = "error";
    item.json.error_message = error.message;
    item.json.conversion_timestamp = new Date().toISOString();
  }
}

return $input.all();