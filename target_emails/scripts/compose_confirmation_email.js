// N8N JavaScript Code - Compose Client Confirmation Email
// This script generates a personalized confirmation email for clients using the Spiral template

// Main function to process the input JSON and generate confirmation email
function composeConfirmationEmail(inputJson) {
  try {
    // Get the JSON data from the input item
    const jsonData = inputJson || $input.first().json;
    
    // Generate confirmation email HTML
    const htmlContent = generateConfirmationHtml(jsonData);
    
    // Return the formatted output
    return [{
      json: {
        html: htmlContent,
        subject: generateConfirmationSubject(jsonData),
        timestamp: new Date().toISOString(),
        recipient: jsonData.email,
        recipientName: jsonData.name
      }
    }];
    
  } catch (error) {
    console.error('Error composing confirmation email:', error);
    return [{
      json: {
        error: 'Failed to compose confirmation email: ' + error.message,
        html: '<p>Error processing confirmation email</p>'
      }
    }];
  }
}

// Generate email subject for confirmation
function generateConfirmationSubject(data) {
  const formName = data.form_name || 'KPI‑based quote request';
  return `We received your ${formName.toLowerCase()} - ${data.name || 'Request received'}`;
}

// Format date for display
function formatDate(dateString) {
  if (!dateString) return 'recently';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    return 'recently';
  }
}

// Format boolean values for display
function formatBoolean(value) {
  if (value === null || value === undefined) return 'No';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    if (lower === 'true' || lower === 'yes' || lower === '1') return 'Yes';
    if (lower === 'false' || lower === 'no' || lower === '0') return 'No';
  }
  return String(value);
}

// Generate a KPI hint from goals_kpis field
function generateKpiHint(goalsKpis) {
  if (!goalsKpis || goalsKpis.trim() === '') return '';
  
  // Take first line or first 100 characters
  const firstLine = goalsKpis.split('\n')[0];
  const hint = firstLine.length > 100 ? firstLine.substring(0, 97) + '...' : firstLine;
  
  return hint ? `We noted your focus on: "${hint}"` : '';
}

// Get configuration values (these could be passed as environment variables in n8n)
function getConfig() {
  return {
    supportEmail: 'support@spiraltechnology.com', // Default - can be overridden
    portalUrl: 'https://portal.spiraltechnology.com', // Default - can be overridden
    companyName: 'Spiral Technology',
    tagline: 'AI • Vision • AR/MR for Industry'
  };
}

// Main function to generate the confirmation HTML email
function generateConfirmationHtml(data) {
  const config = getConfig();
  
  // Prepare all template variables
  const tokens = {
    // Basic info
    name: data.name || 'Valued Customer',
    email: data.email || '',
    company: data.company || 'your organization',
    
    // Form details
    created_at: formatDate(data.created_at),
    id: data.id ? data.id.substring(0, 8) + '...' : 'N/A',
    segment: data.segment || 'business',
    industry: data.industry || 'technology',
    
    // Requirements
    need_nda: formatBoolean(data.need_nda),
    
    // Optional content
    kpi_hint: generateKpiHint(data.goals_kpis),
    
    // Configuration
    support_email: config.supportEmail,
    portal_url: config.portalUrl,
    company_name: config.companyName,
    tagline: config.tagline,
    
    // Form name for header
    form_name: data.form_name || 'KPI‑based quote request'
  };

  // The complete HTML template with token replacement
  const template = `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>We received your request</title>
    <!--[if mso]>
      <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch><o:AllowPNG/></o:OfficeDocumentSettings></xml>
    <![endif]-->
    <style>
      body{margin:0!important;padding:0!important;background:#fdf7fa;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
      table,td{border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;}
      img{border:0;height:auto;line-height:100%;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;}
      a{color:inherit;text-decoration:none;}
      .font{font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',Roboto,Helvetica,Arial,'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol',sans-serif;}
      .container{width:100%;max-width:680px;margin:0 auto;background:#ffffff;}
      .px{padding-left:24px;padding-right:24px;}
      .py{padding-top:24px;padding-bottom:24px;}
      .muted{color:#6b7280;}
      .heading{color:#0b0b0c;}
      .text{color:#111827;}
      .section{border:1px solid #eadbe2;background:#fdf7fa;}
      .divider{border-top:1px solid #eadbe2;}
      .btn{display:inline-block;background:#111827;color:#ffffff;border-radius:9999px;padding:12px 18px;font-weight:600;border:1px solid #111827;}
      .badge{display:inline-block;padding:4px 10px;border:1px solid #eadbe2;border-radius:9999px;font-size:12px;line-height:1;color:#111827;background:#ffffff;}
      .row{padding:14px 0;}
      .label{width:38%;font-size:13px;color:#6b7280;}
      .value{width:62%;font-size:14px;color:#111827;text-align:right;}
      @media (max-width:600px){.px{padding-left:16px;padding-right:16px}.label,.value{display:block;width:100%;text-align:left}.row{padding:12px 0}}
    </style>
  </head>
  <body class="font" style="background:#fdf7fa;">
    <center role="article" aria-roledescription="email" lang="en" style="width:100%;background:#fdf7fa;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fdf7fa;">
        <tr>
          <td align="center" style="padding:32px 12px;">
            <table role="presentation" class="container" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;">
              <!-- Header -->
              <tr>
                <td class="px py" style="padding:20px 24px;border:1px solid #eadbe2;border-bottom:none;background:#ffffff;">
                  <table role="presentation" width="100%">
                    <tr>
                      <td align="left" class="text heading" style="font-weight:600;">${tokens.company_name}</td>
                      <td align="right" class="muted" style="font-size:12px;">${tokens.form_name}</td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Intro / Confirmation -->
              <tr>
                <td class="px py section" style="padding:24px;border:1px solid #eadbe2;background:#fdf7fa;">
                  <div class="heading" style="font-size:20px;font-weight:600;">Thanks, ${tokens.name} — we received your request.</div>
                  <div class="muted" style="margin-top:6px;font-size:13px;">Submitted on <span>${tokens.created_at}</span> · Request ID <span>${tokens.id}</span></div>
                  <p class="text" style="margin:14px 0 0 0;">Our team will review your information and get back to you within <strong>2–3 business days</strong> with a phased plan, KPI suggestions, and budget ranges.</p>
                  <div style="margin-top:12px;">
                    <span class="badge">Segment: <strong>${tokens.segment}</strong></span>
                    <span class="badge" style="margin-left:8px;">Industry: <strong>${tokens.industry}</strong></span>
                  </div>
                </td>
              </tr>
              <!-- Quick echo -->
              <tr>
                <td class="px" style="padding:0 24px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;">
                    <tr><td class="divider" style="border-top:1px solid #eadbe2;line-height:0;font-size:0;">&nbsp;</td></tr>
                    <tr>
                      <td class="row" style="padding:14px 0;">
                        <table role="presentation" width="100%">
                          <tr>
                            <td class="label muted">Company</td>
                            <td class="value text" align="right">${tokens.company}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr><td class="divider" style="border-top:1px solid #eadbe2;line-height:0;">&nbsp;</td></tr>
                    <tr>
                      <td class="row">
                        <table role="presentation" width="100%">
                          <tr>
                            <td class="label muted">Contact email</td>
                            <td class="value text" align="right"><a href="mailto:${tokens.email}">${tokens.email}</a></td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr><td class="divider" style="border-top:1px solid #eadbe2;line-height:0;">&nbsp;</td></tr>
                    <tr>
                      <td class="row">
                        <table role="presentation" width="100%">
                          <tr>
                            <td class="label muted">NDA requested</td>
                            <td class="value text" align="right">${tokens.need_nda}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr><td class="divider" style="border-top:1px solid #eadbe2;line-height:0;">&nbsp;</td></tr>
                  </table>
                </td>
              </tr>
              <!-- Next steps -->
              <tr>
                <td class="px py" style="padding:24px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td class="section" style="border:1px solid #eadbe2;background:#fdf7fa;padding:18px;">
                        <div class="heading" style="font-size:16px;font-weight:600;">What happens next</div>
                        <ol class="muted" style="margin:10px 0 0 18px;padding:0;">
                          <li>We review your goals and any attached context.</li>
                          <li>We draft KPI candidates and a phased delivery plan.</li>
                          <li>We send back a proposal and suggest a call time if helpful.</li>
                        </ol>
                        ${tokens.kpi_hint ? `<div class="muted" style="margin-top:10px;font-size:13px;"><em>${tokens.kpi_hint}</em></div>` : ''}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Actions & Footer -->
              <tr>
                <td class="px py" style="padding:24px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                   
                    <tr>
                      <td align="center" class="muted" style="font-size:12px;">Need something fast? Email <a href="mailto:${tokens.support_email}">${tokens.support_email}</a>.</td>
                    </tr>
                    <tr>
                      <td align="center" class="muted" style="font-size:12px;">${tokens.company_name} · ${tokens.tagline}</td>
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

  return template;
}

// N8N execution - return the result
return composeConfirmationEmail();
