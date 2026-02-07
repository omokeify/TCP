/**
 * BACKEND CODE FOR GOOGLE APPS SCRIPT
 * 
 * INSTRUCTIONS:
 * 1. Go to https://script.google.com/home
 * 2. Click "New Project"
 * 3. Copy and paste ALL code below into the editor (replace existing code)
 * 4. Save the project (Ctrl+S)
 * 5. Click "Deploy" -> "New deployment"
 * 6. Select type: "Web app"
 * 7. Description: "Blink API"
 * 8. Execute as: "Me"
 * 9. Who has access: "Anyone" (Important for the app to access it)
 * 10. Click "Deploy"
 * 11. Copy the "Web App URL"
 * 12. Paste the URL into your Admin Dashboard "Apps Script Web App URL" field
 */

// --- CONFIGURATION ---

const SHEET_NAMES = {
  APPLICATIONS: 'Applications',
  CODES: 'Codes',
  CONFIG: 'Config'
};

// --- ENTRY POINTS ---

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const action = e.parameter.action || (e.postData && JSON.parse(e.postData.contents).action);
    const data = e.postData ? JSON.parse(e.postData.contents).data : null;
    
    let result = {};

    switch (action) {
      case 'setup':
        result = setupSheets();
        break;
      case 'get_config':
        result = getConfig();
        break;
      case 'update_config':
        result = updateConfig(data);
        break;
      case 'submit_application':
        result = submitApplication(data);
        break;
      case 'get_applications':
        result = getApplications();
        break;
      case 'update_status':
        result = updateStatus(data.id, data.status);
        break;
      case 'generate_code':
        result = generateCode(data);
        break;
      case 'get_codes':
        result = getCodes();
        break;
      case 'use_code':
        result = useCode(data.code);
        break;
      case 'trigger_reminders':
        result = triggerReminders();
        break;
      default:
        result = { error: "Unknown action: " + action };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// --- LOGIC ---

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Applications Sheet
  let appSheet = ss.getSheetByName(SHEET_NAMES.APPLICATIONS);
  if (!appSheet) {
    appSheet = ss.insertSheet(SHEET_NAMES.APPLICATIONS);
    appSheet.appendRow(['id', 'email', 'status', 'submittedAt', 'data']);
  }

  // Codes Sheet
  let codeSheet = ss.getSheetByName(SHEET_NAMES.CODES);
  if (!codeSheet) {
    codeSheet = ss.insertSheet(SHEET_NAMES.CODES);
    codeSheet.appendRow(['id', 'code', 'email', 'applicationId', 'used', 'generatedAt']);
  }

  // Config Sheet
  let configSheet = ss.getSheetByName(SHEET_NAMES.CONFIG);
  if (!configSheet) {
    configSheet = ss.insertSheet(SHEET_NAMES.CONFIG);
    configSheet.getRange('A1').setValue('{}');
  }

  return { success: true, message: "Sheets initialized" };
}

function getConfig() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAMES.CONFIG);
  if (!sheet) return {}; // Return empty if not setup
  
  const val = sheet.getRange('A1').getValue();
  return val ? JSON.parse(val) : {};
}

function updateConfig(config) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAMES.CONFIG);
  if (!sheet) setupSheets();
  sheet = ss.getSheetByName(SHEET_NAMES.CONFIG);
  
  sheet.getRange('A1').setValue(JSON.stringify(config));
  return { success: true };
}

function submitApplication(app) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAMES.APPLICATIONS);
  if (!sheet) { setupSheets(); sheet = ss.getSheetByName(SHEET_NAMES.APPLICATIONS); }
  
  // 'id', 'email', 'status', 'submittedAt', 'data'
  sheet.appendRow([
    app.id,
    app.email,
    app.status,
    app.submittedAt,
    JSON.stringify(app)
  ]);
  
  return { success: true, app: app };
}

function getApplications() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.APPLICATIONS);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  const apps = [];
  // Skip header
  for (let i = 1; i < data.length; i++) {
    try {
      // Column 4 (index 4) is 'data' which contains full JSON
      // But let's check structure: id(0), email(1), status(2), submittedAt(3), data(4)
      if (data[i][4]) {
        apps.push(JSON.parse(data[i][4]));
      }
    } catch (e) {
      // Ignore malformed rows
    }
  }
  // Return newest first
  return apps.reverse();
}

function updateStatus(id, status) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.APPLICATIONS);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      // Update Status column (index 2)
      sheet.getRange(i + 1, 3).setValue(status);
      
      // Update JSON blob (index 4)
      const app = JSON.parse(data[i][4]);
      app.status = status;
      sheet.getRange(i + 1, 5).setValue(JSON.stringify(app));
      
      return { success: true };
    }
  }
  return { success: false, message: "Application not found" };
}

function generateCode(data) {
  const { applicationId, email } = data;
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAMES.CODES);
  if (!sheet) { setupSheets(); sheet = ss.getSheetByName(SHEET_NAMES.CODES); }
  
  // Check existing
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][3] == applicationId) { // applicationId is index 3
      // Resend email with existing code
      const existingCode = rows[i][1];
      sendEmail(email, existingCode);
      return { 
        code: existingCode, 
        message: "Resent existing code" 
      };
    }
  }
  
  // Generate new
  const code = 'TCP-' + Math.random().toString(36).substr(2, 6).toUpperCase();
  const id = Math.random().toString(36).substr(2, 9);
  const generatedAt = new Date().toISOString();
  
  // 'id', 'code', 'email', 'applicationId', 'used', 'generatedAt'
  sheet.appendRow([id, code, email, applicationId, false, generatedAt]);
  
  // Send Email
  sendEmail(email, code);
  
  return { 
    id, code, email, applicationId, used: false, generatedAt 
  };
}

function getCodes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.CODES);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  const codes = [];
  for (let i = 1; i < data.length; i++) {
    codes.push({
      id: data[i][0],
      code: data[i][1],
      email: data[i][2],
      applicationId: data[i][3],
      used: data[i][4] === true || data[i][4] === 'true',
      generatedAt: data[i][5]
    });
  }
  return codes;
}

function useCode(codeStr) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.CODES);
  if (!sheet) return { valid: false };
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === codeStr) {
      // Mark as used
      // sheet.getRange(i + 1, 5).setValue(true); // Don't mark used for multiple logins?
      // Logic from local mock: "Mark as used (if not already)"
      // But user wants multiple logins.
      // Let's mark it used to track "at least one login" but allow re-use.
      
      if (data[i][4] !== true && data[i][4] !== 'true') {
        sheet.getRange(i + 1, 5).setValue(true);
      }
      
      return { valid: true };
    }
  }
  return { valid: false };
}

function triggerReminders() {
  // Example logic: Send email to all unused codes?
  // Or all used codes? Mock logic was "remind approved users".
  return { sent: 0, message: "Not implemented in this version" };
}

// --- EMAIL HELPER ---

function sendEmail(recipient, code) {
  const subject = "Your Access Code for The Class Portal";
  
  // Simple HTML Template
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #3B472F;">Welcome!</h2>
      <p>Your application has been approved. Here is your exclusive access code:</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
        <span style="font-size: 24px; font-weight: bold; font-family: monospace; letter-spacing: 2px;">${code}</span>
      </div>
      
      <p>Please enter this code on the access page to enter the portal.</p>
      
      <p style="color: #888; font-size: 12px; margin-top: 30px;">
        If you did not request this, please ignore this email.
      </p>
    </div>
  `;
  
  MailApp.sendEmail({
    to: recipient,
    subject: subject,
    htmlBody: htmlBody
  });
}
