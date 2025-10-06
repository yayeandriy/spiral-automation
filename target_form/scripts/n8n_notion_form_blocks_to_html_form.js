// n8n JavaScript Code to Convert Notion Database Properties to HTML Form
// This script processes Notion database properties and generates HTML form elements

// Input: JSON data from previous node (Notion database properties)
const inputData = $input.all();
const fields_order = $input.last();
// {
// "id": 
// "282c3aed-7a1a-8065-8455-d81d10832ab7",
// "form_fields": 
// [
// "email*",
// "name*",
// "segment",
// "industry"
// ]
// }
// Function to convert property name to label
function formatLabel(name) {
  return name
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, l => l.toUpperCase());
}

// Function to parse field specification with parameters
function parseFieldSpec(fieldSpec) {
  const result = {
    fieldName: fieldSpec,
    isRequired: false,
    label: null,
    description: null,
    inputType: null,
    placeholder: null
  };
  
  // Check for required marker (*)
  if (fieldSpec.endsWith('*')) {
    result.fieldName = fieldSpec.slice(0, -1);
    result.isRequired = true;
  }
  
  // Check for parameters in parentheses
  const paramMatch = result.fieldName.match(/^([^(]+)\((.+)\)$/);
  if (paramMatch) {
    result.fieldName = paramMatch[1];
    const paramsString = paramMatch[2];
    
    // Parse individual parameters
    const params = paramsString.split('|').map(p => p.trim());
    params.forEach(param => {
      if (param.startsWith('label:')) {
        result.label = param.substring(6).trim();
      } else if (param.startsWith('desc:')) {
        result.description = param.substring(5).trim();
      } else if (param.startsWith('input:')) {
        result.inputType = param.substring(6).trim();
      } else if (param.startsWith('placeholder:')) {
        result.placeholder = param.substring(12).trim();
      }
    });
  }
  
  return result;
}

// Function to generate HTML form field based on property type
function generateFormField(propertyName, property, fieldConfig = {}) {
  const { isRequired = false, label: customLabel = null, description = null, inputType = null, placeholder = null } = fieldConfig;
  
  const label = customLabel || formatLabel(propertyName);
  const id = propertyName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const required = isRequired || property.type === 'title' ? 'required' : '';
  
  let html = `    <div class="form-group">\n`;
  html += `      <label for="${id}">${label}${required ? ' *' : ''}:</label>\n`;
  
  // Add description if provided
  if (description) {
    html += `      <div class="field-description">${description}</div>\n`;
  }
  
  // Use custom input type if specified, otherwise use property type
  const effectiveInputType = inputType || property.type;
  
  switch (effectiveInputType) {
    case 'textarea':
      const textareaPlaceholder = placeholder ? ` placeholder="${placeholder}"` : '';
      html += `      <textarea id="${id}" name="${propertyName}" rows="4" ${required}${textareaPlaceholder}></textarea>\n`;
      break;
      
    case 'title':
    case 'rich_text':
      const textPlaceholder = placeholder ? ` placeholder="${placeholder}"` : '';
      html += `      <input type="text" id="${id}" name="${propertyName}" ${required}${textPlaceholder}>\n`;
      break;
      
    case 'email':
      const emailPlaceholder = placeholder ? ` placeholder="${placeholder}"` : '';
      html += `      <input type="email" id="${id}" name="${propertyName}" ${required}${emailPlaceholder}>\n`;
      break;
      
    case 'number':
      const numberPlaceholder = placeholder ? ` placeholder="${placeholder}"` : '';
      html += `      <input type="number" id="${id}" name="${propertyName}" ${required}${numberPlaceholder}>\n`;
      break;
      
    case 'url':
      const urlPlaceholder = placeholder ? ` placeholder="${placeholder}"` : '';
      html += `      <input type="url" id="${id}" name="${propertyName}" ${required}${urlPlaceholder}>\n`;
      break;
      
    case 'phone_number':
      const telPlaceholder = placeholder ? ` placeholder="${placeholder}"` : '';
      html += `      <input type="tel" id="${id}" name="${propertyName}" ${required}${telPlaceholder}>\n`;
      break;
      
    case 'date':
      html += `      <input type="date" id="${id}" name="${propertyName}" ${required}>\n`;
      break;
      
    case 'checkbox':
      html += `      <input type="checkbox" id="${id}" name="${propertyName}" value="true">\n`;
      break;
      
    case 'select':
      html += `      <select id="${id}" name="${propertyName}" ${required}>\n`;
      html += `        <option value=""> Please choose an option</option>\n`;
      if (property.select && property.select.options) {
        property.select.options.forEach(option => {
          html += `        <option value="${option.name}">${formatLabel(option.name)}</option>\n`;
        });
      }
      html += `      </select>\n`;
      break;
      
    case 'multi_select':
      html += `      <div class="checkbox-group">\n`;
      if (property.multi_select && property.multi_select.options) {
        property.multi_select.options.forEach(option => {
          const optionId = `${id}_${option.name.replace(/[^a-z0-9]/g, '_')}`;
          html += `        <div class="checkbox-item">\n`;
          html += `          <input type="checkbox" id="${optionId}" name="${propertyName}[]" value="${option.name}">\n`;
          html += `          <label for="${optionId}">${formatLabel(option.name)}</label>\n`;
          html += `        </div>\n`;
        });
      }
      html += `      </div>\n`;
      break;
      
    default:
      // Fallback for unknown property types
      const defaultPlaceholder = placeholder || `Enter ${label}`;
      html += `      <input type="text" id="${id}" name="${propertyName}" placeholder="${defaultPlaceholder}">\n`;
      break;
  }
  
  html += `    </div>\n`;
  return html;
}

// Function to generate HTML form (form element only)
function generateHtmlForm(database) {
  const formTitle = database.title && database.title.length > 0 
    ? database.title[0].plain_text 
    : 'Form';
  
  // Extract submit URL from _action/ property if it exists
  let submitUrl = 'submit';
  let successPageUrl = null;
  
  if (database.properties) {
    // Find action property
    const actionProperty = Object.keys(database.properties).find(key => key.startsWith('_action/'));
    if (actionProperty) {
      submitUrl = actionProperty.substring(8); // Remove '_action/' prefix
    }
    
    // Find success page property
    const successPageProperty = Object.keys(database.properties).find(key => key.startsWith('_success_page/'));
    if (successPageProperty) {
      successPageUrl = successPageProperty.substring(14); // Remove '_success_page/' prefix
    }
  }
  
  // Build final submit URL with success page parameter
  let finalSubmitUrl = `/${submitUrl}`;
  if (successPageUrl) {
    finalSubmitUrl += `?success_page=${encodeURIComponent(successPageUrl)}`;
  }
  
  let html = `<form id="notionForm" method="POST" action="${finalSubmitUrl}">
`;

  // Generate form fields for each property
  if (database.properties) {
    // Check if we have field order configuration for this database
    let orderedFields = [];
    let requiredFields = new Set();
    
    if (fields_order && fields_order.json && fields_order.json.id === database.id && fields_order.json.form_fields) {
      // Use the specified order and required fields
      fields_order.json.form_fields.forEach(fieldSpec => {
        const parsedField = parseFieldSpec(fieldSpec);
        const fieldName = parsedField.fieldName;
        
        if (database.properties[fieldName] && !fieldName.startsWith('_')) {
          orderedFields.push([fieldName, database.properties[fieldName], parsedField]);
        }
      });
    } else {
      // Fallback to original behavior: filter out underscore properties and sort
      orderedFields = Object.entries(database.properties)
        .filter(([propertyName]) => !propertyName.startsWith('_'))
        .sort(([, a], [, b]) => {
          if (a.type === 'title') return -1;
          if (b.type === 'title') return 1;
          return a.name.localeCompare(b.name);
        });
    }
    
    orderedFields.forEach(([propertyName, property, fieldConfig]) => {
      const config = fieldConfig ? {
        isRequired: fieldConfig.isRequired,
        label: fieldConfig.label,
        description: fieldConfig.description,
        inputType: fieldConfig.inputType,
        placeholder: fieldConfig.placeholder
      } : { isRequired: requiredFields.has(propertyName) };
      
      html += generateFormField(propertyName, property, config);
    });
  }

  html += `    <div class="form-group">
      <button type="submit" class="button-main button">${formatLabel(formTitle)}</button>
    </div>
</form>`;

  return html;
}

// Process the input data
let output = [];

inputData.forEach((item, index) => {
  try {
    // Handle both single database object and array of databases
    const databases = Array.isArray(item.json) ? item.json : [item.json];
    
    databases.forEach((database, dbIndex) => {
      if (database.object === 'database' && database.properties) {
        const htmlForm = generateHtmlForm(database);
        
        output.push({
          json: {
            database_id: database.id,
            database_title: database.title && database.title.length > 0 
              ? database.title[0].plain_text 
              : 'Untitled Form',
            html_form: htmlForm,
            properties_count: Object.keys(database.properties).length,
            created_time: database.created_time,
            last_edited_time: database.last_edited_time
          }
        });
      }
    });
  } catch (error) {
    output.push({
      json: {
        error: `Error processing item ${index}: ${error.message}`,
        original_data: item.json
      }
    });
  }
});

// Return the processed data
return output;
