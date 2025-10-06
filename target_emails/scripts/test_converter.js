// Test script to demonstrate the JSON to HTML email converter
// This shows how the n8n script works with sample data

const fs = require('fs');
const path = require('path');

// Load the sample JSON data
const sampleJsonPath = path.join(__dirname, '../samples/form_response.json');
const sampleData = JSON.parse(fs.readFileSync(sampleJsonPath, 'utf8'));

// Mock n8n input structure for testing
const $input = {
  first: () => ({ json: sampleData })
};

// Import and run the converter function
// (Note: In actual n8n, this would be the main script content)

// Function to convert field names to human readable format
function humanizeFieldName(fieldName) {
  return fieldName
    .replace(/_/g, ' ')           // Replace underscores with spaces
    .replace(/([A-Z])/g, ' $1')   // Add space before capital letters
    .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
    .replace(/\s+/g, ' ')         // Remove extra spaces
    .trim();
}

// Function to format field values
function formatFieldValue(value) {
  if (value === null || value === undefined) {
    return '<span style="color: #888; font-style: italic;">Not provided</span>';
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  if (typeof value === 'object') {
    return '<pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; font-size: 12px;">' + 
           JSON.stringify(value, null, 2) + '</pre>';
  }
  
  // Format dates
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
    try {
      const date = new Date(value);
      return date.toLocaleString();
    } catch (e) {
      return value;
    }
  }
  
  // Format emails as clickable links
  if (typeof value === 'string' && value.includes('@') && value.includes('.')) {
    return `<a href="mailto:${value}" style="color: #007bff; text-decoration: none;">${value}</a>`;
  }
  
  // Format URLs as clickable links
  if (typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'))) {
    return `<a href="${value}" style="color: #007bff; text-decoration: none;" target="_blank">${value}</a>`;
  }
  
  return String(value);
}

// Function to determine field importance for styling
function getFieldPriority(fieldName) {
  const highPriority = ['name', 'email', 'company', 'subject', 'message', 'title'];
  const mediumPriority = ['phone', 'industry', 'segment', 'goals', 'budget', 'timeline'];
  
  const lowerField = fieldName.toLowerCase();
  
  if (highPriority.some(field => lowerField.includes(field))) {
    return 'high';
  }
  if (mediumPriority.some(field => lowerField.includes(field))) {
    return 'medium';
  }
  return 'low';
}

// Function to get field styling based on priority
function getFieldStyling(priority) {
  switch (priority) {
    case 'high':
      return {
        labelStyle: 'font-weight: bold; color: #2c3e50; font-size: 14px;',
        valueStyle: 'font-weight: 500; color: #34495e; font-size: 14px;'
      };
    case 'medium':
      return {
        labelStyle: 'font-weight: 600; color: #5a6c7d; font-size: 13px;',
        valueStyle: 'color: #5a6c7d; font-size: 13px;'
      };
    default:
      return {
        labelStyle: 'font-weight: 500; color: #7f8c8d; font-size: 12px;',
        valueStyle: 'color: #95a5a6; font-size: 12px;'
      };
  }
}

// Function to generate email subject based on JSON content
function generateEmailSubject(data) {
  if (data.name || data.email || data.company) {
    let subject = 'New Form Submission';
    if (data.name) subject += ` from ${data.name}`;
    if (data.company) subject += ` (${data.company})`;
    return subject;
  }
  
  return 'Data Notification - ' + new Date().toLocaleDateString();
}

// Main function to generate HTML email
function generateEmailHtml(data) {
  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Data Notification</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .email-container {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 300;
        }
        .content {
            padding: 30px 20px;
        }
        .field-group {
            margin-bottom: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            border-radius: 0 4px 4px 0;
        }
        .field-group.high-priority {
            background: #e8f4fd;
            border-left-color: #007bff;
        }
        .field-group.medium-priority {
            background: #fff3cd;
            border-left-color: #ffc107;
        }
        .field-label {
            display: block;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .field-value {
            display: block;
            word-wrap: break-word;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6c757d;
            border-top: 1px solid #e9ecef;
        }
        .timestamp {
            font-style: italic;
            color: #6c757d;
            font-size: 11px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>📧 Data Notification</h1>
            <div class="timestamp">Generated on ${new Date().toLocaleString()}</div>
        </div>
        <div class="content">
`;

  // Sort fields by priority
  const fields = Object.entries(data);
  const sortedFields = fields.sort(([keyA], [keyB]) => {
    const priorityA = getFieldPriority(keyA);
    const priorityB = getFieldPriority(keyB);
    
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[priorityA] - priorityOrder[priorityB];
  });

  // Generate HTML for each field
  sortedFields.forEach(([key, value]) => {
    if (key === 'id' && typeof value === 'string' && value.length > 20) {
      // Skip long IDs or show them in a compact way
      return;
    }
    
    const priority = getFieldPriority(key);
    const styling = getFieldStyling(priority);
    const humanLabel = humanizeFieldName(key);
    const formattedValue = formatFieldValue(value);
    
    html += `
            <div class="field-group ${priority}-priority">
                <span class="field-label" style="${styling.labelStyle}">${humanLabel}</span>
                <span class="field-value" style="${styling.valueStyle}">${formattedValue}</span>
            </div>`;
  });

  html += `
        </div>
        <div class="footer">
            <p>This email was automatically generated from submitted data.</p>
            <p>📊 Total fields processed: ${fields.length}</p>
        </div>
    </div>
</body>
</html>`;

  return html;
}

// Test the converter
function testConverter() {
  try {
    const result = {
      html: generateEmailHtml(sampleData),
      subject: generateEmailSubject(sampleData),
      timestamp: new Date().toISOString()
    };
    
    // Write the output HTML to a file for testing
    const outputPath = path.join(__dirname, '../samples/generated_email.html');
    fs.writeFileSync(outputPath, result.html);
    
    console.log('✅ Email HTML generated successfully!');
    console.log('📧 Subject:', result.subject);
    console.log('📁 Output saved to:', outputPath);
    console.log('🕒 Generated at:', result.timestamp);
    
    return result;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

// Run the test
testConverter();