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
 * 11. Description: "Blink API v5 - Admin Notes"
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
    // Robust Parameter Parsing
    let action = e.parameter.action;
    let data = null;

    if (!action && e.postData && e.postData.contents) {
      try {
        const json = JSON.parse(e.postData.contents);
        action = json.action;
        data = json.data;
      } catch (jsonErr) {
        // Fallback for text payloads
      }
    }

    if (!action) {
      return ContentService.createTextOutput(JSON.stringify({ error: "No action specified" })).setMimeType(ContentService.MimeType.JSON);
    }
    
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
      case 'update_application':
        result = updateApplication(data.id, data.updates);
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
      case 'batch_approve':
        result = batchApprove(data.ids);
        break;
      default:
        result = { error: "Unknown action: " + action };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: "Server Error: " + err.toString() }))
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
  let config = {};
  
  // 1. Load Config
  let sheet = ss.getSheetByName(SHEET_NAMES.CONFIG);
  if (sheet) {
    const val = sheet.getRange('A1').getValue();
    try {
      config = val ? JSON.parse(val) : {};
    } catch (e) { }
  }
  
  // 2. Load Stats
  let appSheet = ss.getSheetByName(SHEET_NAMES.APPLICATIONS);
  if (appSheet) {
    const data = appSheet.getDataRange().getValues();
    let approved = 0;
    // Column 3 (index 2) is status
    for (let i = 1; i < data.length; i++) {
       if (String(data[i][2]).toLowerCase() === 'approved') {
         approved++;
       }
    }
    config.stats = { approved, total: Math.max(0, data.length - 1) };
  }
  
  return config;
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
      if (data[i][4]) {
        apps.push(JSON.parse(data[i][4]));
      }
    } catch (e) { }
  }
  return apps.reverse();
}

function updateApplication(id, updates) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.APPLICATIONS);
  if (!sheet) return { success: false, message: "Sheet not found" };
  
  const data = sheet.getDataRange().getValues();
  const targetId = String(id).trim();
  
  for (let i = 1; i < data.length; i++) {
    // Column 0 is ID (index 0)
    const rowId = String(data[i][0]).trim();
    
    if (rowId === targetId) {
      try {
        // If status is being updated, update the dedicated column (Column 3 / index 2)
        if (updates.status) {
            sheet.getRange(i + 1, 3).setValue(updates.status);
        }
        
        // Update JSON Blob (Column 5 / index 4)
        let app = {};
        try {
            app = JSON.parse(data[i][4]);
        } catch(e) {
            // Reconstruct if missing/broken
            app = { id: rowId, email: data[i][1], submittedAt: data[i][3] };
        }
        
        // Merge updates
        Object.keys(updates).forEach(key => {
            app[key] = updates[key];
        });
        
        sheet.getRange(i + 1, 5).setValue(JSON.stringify(app));
        
        return { success: true };
      } catch (e) {
        return { success: false, message: "Write failed: " + e.toString() };
      }
    }
  }
  return { success: false, message: "Application ID not found: " + targetId };
}

function batchApprove(ids) {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return { success: false, message: "No IDs provided" };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const appSheet = ss.getSheetByName(SHEET_NAMES.APPLICATIONS);
  if (!appSheet) return { success: false, message: "App sheet not found" };

  const data = appSheet.getDataRange().getValues();
  let approvedCount = 0;
  
  const targetIds = new Set(ids.map(id => String(id).trim()));
  
  for (let i = 1; i < data.length; i++) {
    const rowId = String(data[i][0]).trim();
    
    if (targetIds.has(rowId)) {
      const currentStatus = String(data[i][2]).toLowerCase();
      
      if (currentStatus !== 'approved') {
         try {
             // Update Status Column
             appSheet.getRange(i + 1, 3).setValue('approved');
             
             // Update JSON
             let app = {};
             try { app = JSON.parse(data[i][4]); } catch(e) { 
                 app = { id: rowId, email: data[i][1], submittedAt: data[i][3] }; 
             }
             app.status = 'approved';
             appSheet.getRange(i + 1, 5).setValue(JSON.stringify(app));
             
             // Generate Code & Email
             generateCode({ applicationId: rowId, email: data[i][1] });
             
             approvedCount++;
         } catch (e) {
             console.log("Failed to approve " + rowId + ": " + e.toString());
         }
      }
    }
  }
  
  return { success: true, count: approvedCount };
}

function generateCode(data) {
  const { applicationId, email } = data;
  const targetAppId = String(applicationId).trim();
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAMES.CODES);
  if (!sheet) { setupSheets(); sheet = ss.getSheetByName(SHEET_NAMES.CODES); }
  
  // Check existing
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const rowAppId = String(rows[i][3]).trim();
    if (rowAppId === targetAppId) {
      const existingCode = rows[i][1];
      sendEmail(email, existingCode);
      return { code: existingCode, message: "Resent existing code" };
    }
  }
  
  // Generate new
  const code = 'TCP-' + Math.random().toString(36).substr(2, 6).toUpperCase();
  const id = Math.random().toString(36).substr(2, 9);
  const generatedAt = new Date().toISOString();
  
  sheet.appendRow([id, code, email, applicationId, false, generatedAt]);
  
  // Send Email
  sendEmail(email, code);
  
  return { id, code, email, applicationId, used: false, generatedAt };
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
  if (!codeStr) return { valid: false, message: "No code provided" };
  const normalizedCode = codeStr.toString().trim();

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Try to find in CODES sheet
  let sheet = ss.getSheetByName(SHEET_NAMES.CODES);
  if (!sheet) { setupSheets(); sheet = ss.getSheetByName(SHEET_NAMES.CODES); }
  
  const data = sheet.getDataRange().getValues();
  let codeRowIndex = -1;
  let codeEntry = null;

  for (let i = 1; i < data.length; i++) {
    if (data[i][1] && data[i][1].toString().trim() === normalizedCode) {
      codeRowIndex = i + 1; // 1-based row index
      codeEntry = {
        email: data[i][2],
        applicationId: data[i][3],
        used: data[i][4]
      };
      break;
    }
  }

  // 2. Fallback: If not in Codes, check Applications (Auto-Recover)
  // This helps if the Code sheet was deleted or desynced but App is Approved.
  if (codeRowIndex === -1) {
    // If code is not found, we can't look up the app ID easily.
    return { valid: false, message: "Code not found in system. Please check your email." };
  }

  // 3. Verify Status in Application Sheet (Double Check)
  // This ensures that if an app was rejected LATER, the code is invalidated.
  const appSheet = ss.getSheetByName(SHEET_NAMES.APPLICATIONS);
  if (appSheet && codeEntry.applicationId) {
    const apps = appSheet.getDataRange().getValues();
    let isApproved = false;
    let appFound = false;
    const targetAppId = String(codeEntry.applicationId).trim();
    
    for (let i = 1; i < apps.length; i++) {
      if (String(apps[i][0]).trim() == targetAppId) { // Match ID
        appFound = true;
        // Check both Status column (index 2) and JSON blob
        const statusCol = apps[i][2];
        if (String(statusCol).toLowerCase() === 'approved') {
          isApproved = true;
        }
        break;
      }
    }
    
    if (appFound && !isApproved) {
       return { valid: false, message: "Your application is no longer approved." };
    }
  }

  // 4. Session Expiration
  const config = getConfig();
  
  if (config.sessions && config.sessions.length > 0) {
    let lastSessionEnd = null;
    config.sessions.forEach(session => {
      const end = parseSessionEnd(session.date, session.time);
      if (end && (!lastSessionEnd || end.getTime() > lastSessionEnd.getTime())) {
        lastSessionEnd = end;
      }
    });

    if (lastSessionEnd) {
      const now = new Date();
      // Add 24h buffer
      if (now.getTime() > (lastSessionEnd.getTime() + 86400000)) { 
        return { valid: false, message: "Class session has ended. Code expired." };
      }
    }
  } else if (config.date && config.time) {
     const end = parseSessionEnd(config.date, config.time);
     if (end) {
        const now = new Date();
        if (now.getTime() > (end.getTime() + 86400000)) {
           return { valid: false, message: "Class session has ended. Code expired." };
        }
     }
  }

  // 5. Mark Used
  if (codeEntry.used !== true && codeEntry.used !== 'true') {
    sheet.getRange(codeRowIndex, 5).setValue(true);
  }
      
  return { valid: true };
}

function parseSessionEnd(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  try {
    const times = timeStr.match(/(\d{1,2}:\d{2}\s?(?:AM|PM)?)/gi);
    if (!times || times.length < 1) return null;
    
    const endTimeStr = times[times.length - 1]; 
    const combined = dateStr + ' ' + endTimeStr;
    const date = new Date(combined);
    
    if (isNaN(date.getTime())) return null;
    return date;
  } catch (e) {
    return null;
  }
}

function triggerReminders() {
  return { sent: 0, message: "Not implemented in this version" };
}

// --- EMAIL HELPER ---

function sendEmail(recipient, code) {
  const subject = "Your Access Code for The Class Portal";
  
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #3B472F;">Welcome!</h2>
      <p>Your application has been approved. Here is your exclusive access code:</p>
      <div style="background-color: #f5f5f5; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
        <span style="font-size: 24px; font-weight: bold; font-family: monospace; letter-spacing: 2px;">${code}</span>
      </div>
      <p>Please enter this code on the access page to enter the portal.</p>
      <p style="color: #888; font-size: 12px; margin-top: 30px;">If you did not request this, please ignore this email.</p>
    </div>
  `;
  
  try {
    MailApp.sendEmail({
      to: recipient,
      subject: subject,
      htmlBody: htmlBody
    });
  } catch (e) {
    console.log("Failed to send email: " + e.toString());
  }
}
