// N8N JavaScript Code - Convert JSON to HTML Email (Spiral Template Style)
// This script converts any JSON object into a well-formatted HTML email using Spiral Technology template design

// Main function to process the input JSON
function convertJsonToHtmlEmail(inputJson) {
  try {
    // Get the JSON data from the input item
    const jsonData = inputJson || $input.first().json;
    
    // Generate HTML content using Spiral template design
    const htmlContent = generateSpiralEmailHtml(jsonData);
    
    // Return the formatted output
    return [{
      json: {
        html: htmlContent,
        subject: generateEmailSubject(jsonData),
        timestamp: new Date().toISOString()
      }
    }];
    
  } catch (error) {
    console.error('Error converting JSON to HTML:', error);
    return [{
      json: {
        error: 'Failed to convert JSON to HTML: ' + error.message,
        html: '<p>Error processing data</p>'
      }
    }];
  }
}

// Function to generate email subject based on JSON content
function generateEmailSubject(data) {
  // Use form_name if available, otherwise fallback
  const formTitle = data.form_name || 'New Data Submission';
  
  // Try to find common fields that might be good for subject
  if (data.name || data.email || data.company) {
    let subject = formTitle;
    if (data.name) subject += ` from ${data.name}`;
    if (data.company) subject += ` (${data.company})`;
    return subject;
  }
  
  // Fallback subject
  return formTitle + ' - ' + new Date().toLocaleDateString();
}

// Function to convert field names to human readable format
function humanizeFieldName(fieldName) {
  // Custom mappings for better readability
  const customMappings = {
    'goals_kpis': 'Goals / KPIs',
    'need_nda': 'NDA required',
    'data_volume': 'Data volume',
    'created_at': 'Submitted at',
    'code_expired_at': 'Code expires at'
  };
  
  if (customMappings[fieldName]) {
    return customMappings[fieldName];
  }
  
  return fieldName
    .replace(/_/g, ' ')           // Replace underscores with spaces
    .replace(/([A-Z])/g, ' $1')   // Add space before capital letters
    .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
    .replace(/\s+/g, ' ')         // Remove extra spaces
    .trim();
}

// Function to format field values with Spiral template styling
function formatFieldValue(value) {
  if (value === null || value === undefined || value === '') {
    return '<span style="color: #6b7280; font-style: italic;">Not provided</span>';
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  if (typeof value === 'object') {
    return '<pre style="background: #fdf7fa; padding: 10px; border: 1px solid #eadbe2; font-size: 12px; font-family: monospace;">' + 
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
  
  // Format emails as clickable links with template styling
  if (typeof value === 'string' && value.includes('@') && value.includes('.')) {
    return `<a href="mailto:${value}" style="color: #111827; text-decoration: none;">${value}</a>`;
  }
  
  // Format URLs as clickable links
  if (typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'))) {
    return `<a href="${value}" style="color: #111827; text-decoration: none;" target="_blank">${value}</a>`;
  }
  
  return String(value);
}

// Function to categorize fields for different sections
function getFieldCategory(fieldName) {
  const contactFields = ['name', 'email', 'company', 'industry', 'segment'];
  const contextFields = ['data_volume', 'deployment', 'timeline', 'budget'];
  const textFields = ['goals_kpis', 'notes'];
  const metaFields = ['id', 'created_at', 'code', 'code_expired_at', 'need_nda', 'subscribed'];
  
  const lowerField = fieldName.toLowerCase();
  
  if (contactFields.some(field => lowerField.includes(field))) {
    return 'contact';
  }
  if (contextFields.some(field => lowerField.includes(field))) {
    return 'context';
  }
  if (textFields.some(field => lowerField.includes(field))) {
    return 'text';
  }
  if (metaFields.some(field => lowerField.includes(field))) {
    return 'meta';
  }
  return 'other';
}

// Function to get field order priority
function getFieldOrder(fieldName) {
  const orderMap = {
    'name': 1,
    'email': 2,
    'company': 3,
    'industry': 4,
    'segment': 5,
    'need_nda': 6,
    'subscribed': 7,
    'goals_kpis': 10,
    'data_volume': 20,
    'deployment': 21,
    'timeline': 22,
    'budget': 23,
    'notes': 30,
    'created_at': 100,
    'id': 101
  };
  
  return orderMap[fieldName] || 50;
}

// Main function to generate HTML email using Spiral template design
function generateSpiralEmailHtml(data) {
  const timestamp = new Date().toLocaleString();
  
  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>${data.form_name || 'New Data Submission'}</title>
    <!--[if mso]>
      <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch><o:AllowPNG/></o:OfficeDocumentSettings></xml>
    <![endif]-->
    <style>
      /* Base resets for email */
      body{margin:0!important;padding:0!important;background:#fdf7fa;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
      table,td{border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;}
      img{border:0;height:auto;line-height:100%;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;}
      a{color:inherit;text-decoration:none;}
      /* Typography */
      .font{font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', sans-serif;}
      /* Layout */
      .container{width:100%;max-width:680px;margin:0 auto;background:#ffffff;}
      .px{padding-left:24px;padding-right:24px;}
      .py{padding-top:24px;padding-bottom:24px;}
      .section{border:1px solid #eadbe2;background:#fdf7fa;}
      .divider{border-top:1px solid #eadbe2;}
      /* Text colors */
      .muted{color:#6b7280;} /* neutral-500 */
      .heading{color:#0b0b0c;} /* near-black */
      .text{color:#111827;} /* neutral-900 */
      /* Badges */
      .badge{display:inline-block;padding:4px 10px;border:1px solid #eadbe2;border-radius:9999px;font-size:12px;line-height:1;color:#111827;background:#ffffff;}
      .badge-ok{background:#111827;color:#ffffff;border-color:#111827;}
      /* Button (bulletproof-ish) */
      .btn{display:inline-block;background:#111827;color:#ffffff;border-radius:9999px;padding:12px 18px;font-weight:600;border:1px solid #111827;}
      /* Grid-like rows */
      .row{padding:14px 0;}
      .label{width:38%;font-size:13px;color:#6b7280;}
      .value{width:62%;font-size:14px;color:#111827;text-align:right;}
      @media (max-width:600px){
        .px{padding-left:16px;padding-right:16px;}
        .label,.value{display:block;width:100%;text-align:left;}
        .row{padding:12px 0;}
      }
    </style>
  </head>
  <body class="font" style="background:#fdf7fa;">
    <center role="article" aria-roledescription="email" lang="en" style="width:100%;background:#fdf7fa;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fdf7fa;">
        <tr>
          <td align="center" style="padding:32px 12px;">
            <!-- Header -->
            <table role="presentation" class="container" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;">
              <tr>
                <td class="px py" style="padding:20px 24px;border:1px solid #eadbe2;border-bottom:none;background:#ffffff;">
                  <table role="presentation" width="100%">
                    <tr>
                      <td align="left" class="text heading font" style="font-weight:600;">Spiral Technology</td>
                      <td align="right" class="muted font" style="font-size:12px;">${data.form_name || 'New Data Submission'}</td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Title / Summary -->
              <tr>
                <td class="px py section" style="padding:24px;border:1px solid #eadbe2;background:#fdf7fa;">
                  <div class="font heading" style="font-size:20px;font-weight:600;">${data.form_name || 'New data submission received'}</div>
                  <div class="font muted" style="margin-top:6px;font-size:13px;">Received ${timestamp}</div>
                  ${generateBadges(data)}
                </td>
              </tr>
              
              ${generateContactFields(data)}
              ${generateContentSections(data)}
              
              <!-- Footer -->
              <tr>
                <td class="px py" style="padding:24px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td align="center" class="muted font" style="font-size:12px;">This email was automatically generated from submitted data.</td>
                    </tr>
                    <tr>
                      <td align="center" class="muted font" style="font-size:12px;">Spiral Technology · AI • Vision • AR/MR for Industry</td>
                    </tr>
                    <tr><td height="8"></td></tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </center>
  </body>
</html>`;
}

// Generate badges for the header section
function generateBadges(data) {
  let badges = '<div style="margin-top:12px;">';
  
  if (data.segment) {
    badges += `<span class="badge font">Segment: <strong>${data.segment}</strong></span>`;
  }
  if (data.industry) {
    badges += `<span class="badge font" style="margin-left:8px;">Industry: <strong>${data.industry}</strong></span>`;
  }
  if (data.id) {
    const shortId = data.id.length > 8 ? data.id.substring(0, 8) + '...' : data.id;
    badges += `<span class="badge font" style="margin-left:8px;">ID: ${shortId}</span>`;
  }
  
  badges += '</div>';
  return badges;
}

// Generate contact fields section
function generateContactFields(data) {
  const contactFields = ['name', 'email', 'company', 'industry', 'segment', 'need_nda', 'subscribed'];
  const sortedFields = Object.entries(data)
    .filter(([key]) => contactFields.includes(key))
    .sort(([keyA], [keyB]) => getFieldOrder(keyA) - getFieldOrder(keyB));
  
  if (sortedFields.length === 0) return '';
  
  let html = `
              <!-- Key details grid -->
              <tr>
                <td class="px" style="padding:0 24px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;">
                    <tr><td class="divider" style="border-top:1px solid #eadbe2;line-height:0;font-size:0;">&nbsp;</td></tr>`;
  
  sortedFields.forEach(([key, value]) => {
    const label = humanizeFieldName(key);
    const formattedValue = formatFieldValue(value);
    
    html += `
                    <tr>
                      <td class="row" style="padding:14px 0;">
                        <table role="presentation" width="100%">
                          <tr>
                            <td class="label font muted">${label}</td>
                            <td class="value font text" align="right">${formattedValue}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr><td class="divider" style="border-top:1px solid #eadbe2;line-height:0;">&nbsp;</td></tr>`;
  });
  
  html += `
                  </table>
                </td>
              </tr>`;
  
  return html;
}

// Generate content sections (Goals/KPIs, Context, Notes)
function generateContentSections(data) {
  let html = `
              <tr>
                <td class="px py" style="padding:24px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">`;
  
  // Goals/KPIs section
  if (data.goals_kpis) {
    html += `
                    <tr>
                      <td class="section" style="border:1px solid #eadbe2;background:#fdf7fa;padding:18px;">
                        <div class="font heading" style="font-size:16px;font-weight:600;">Goals / KPIs</div>
                        <div class="font text" style="margin-top:8px;font-size:14px;white-space:pre-line;">${formatFieldValue(data.goals_kpis)}</div>
                      </td>
                    </tr>
                    <tr><td height="12"></td></tr>`;
  }
  
  // Operational context section
  const contextFields = ['data_volume', 'deployment', 'timeline', 'budget'];
  const hasContextData = contextFields.some(field => data[field]);
  
  if (hasContextData) {
    html += `
                    <tr>
                      <td class="section" style="border:1px solid #eadbe2;background:#fdf7fa;padding:18px;">
                        <div class="font heading" style="font-size:16px;font-weight:600;">Operational context</div>
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:8px;">`;
    
    contextFields.forEach(field => {
      if (data[field]) {
        html += `
                          <tr>
                            <td class="label font muted" style="padding:6px 0;">${humanizeFieldName(field)}</td>
                            <td class="value font text" style="padding:6px 0;" align="right">${formatFieldValue(data[field])}</td>
                          </tr>`;
      }
    });
    
    html += `
                        </table>
                      </td>
                    </tr>
                    <tr><td height="12"></td></tr>`;
  }
  
  // Notes section
  if (data.notes) {
    html += `
                    <tr>
                      <td class="section" style="border:1px solid #eadbe2;background:#fdf7fa;padding:18px;">
                        <div class="font heading" style="font-size:16px;font-weight:600;">Notes</div>
                        <div class="font text" style="margin-top:8px;font-size:14px;white-space:pre-line;">${formatFieldValue(data.notes)}</div>
                      </td>
                    </tr>
                    <tr><td height="12"></td></tr>`;
  }
  
  // Other fields section (if any)
  const handledFields = ['name', 'email', 'company', 'industry', 'segment', 'need_nda', 'subscribed', 'goals_kpis', 'notes', 'data_volume', 'deployment', 'timeline', 'budget', 'id', 'created_at', 'form_name'];
  const otherFields = Object.entries(data).filter(([key]) => !handledFields.includes(key));
  
  if (otherFields.length > 0) {
    html += `
                    <tr>
                      <td class="section" style="border:1px solid #eadbe2;background:#fdf7fa;padding:18px;">
                        <div class="font heading" style="font-size:16px;font-weight:600;">Additional Information</div>
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:8px;">`;
    
    otherFields.forEach(([key, value]) => {
      html += `
                          <tr>
                            <td class="label font muted" style="padding:6px 0;">${humanizeFieldName(key)}</td>
                            <td class="value font text" style="padding:6px 0;" align="right">${formatFieldValue(value)}</td>
                          </tr>`;
    });
    
    html += `
                        </table>
                      </td>
                    </tr>`;
  }
  
  html += `
                  </table>
                </td>
              </tr>`;
  
  return html;
}

// N8N execution - return the result
return convertJsonToHtmlEmail();
