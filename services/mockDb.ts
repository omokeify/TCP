import { Application, ApplicationStatus, InviteCode, ClassConfig, DEFAULT_CLASS_INFO } from '../types';

/* 
  === GOOGLE APPS SCRIPT BACKEND CODE ===
  To use Google Sheets as your database:
  1. Create a new Google Sheet.
  2. Go to Extensions > Apps Script.
  3. Paste the code below into Code.gs.
  4. Run the 'setup' function once to create headers.
  5. Deploy as Web App (Deploy > New Deployment > Web App).
     - Execute as: Me
     - Who has access: Anyone
  6. Copy the Web App URL and paste it into the Blink Admin Settings.

  --- START APPS SCRIPT ---
  const CONFIG_SHEET = "Config";
  const APPS_SHEET = "Applications";
  const CODES_SHEET = "Codes";

  function setup() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss.getSheetByName(CONFIG_SHEET)) ss.insertSheet(CONFIG_SHEET).appendRow(["JSON_DATA"]);
    if (!ss.getSheetByName(APPS_SHEET)) ss.insertSheet(APPS_SHEET).appendRow(["ID", "Email", "Status", "Data_JSON", "SubmittedAt"]);
    if (!ss.getSheetByName(CODES_SHEET)) ss.insertSheet(CODES_SHEET).appendRow(["ID", "Code", "Email", "AppID", "Used", "GeneratedAt"]);
  }

  function doPost(e) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    
    try {
      if (action === 'submit_application') {
        const app = body.data;
        // Handle Image Uploads (Convert Base64 to Drive File)
        const proofs = app.taskProofs || {};
        for (const key in proofs) {
          if (proofs[key] && proofs[key].startsWith('data:image')) {
            const blobs = proofs[key].split(",");
            const type = blobs[0].split(";")[0].split(":")[1];
            const decoded = Utilities.base64Decode(blobs[1]);
            const blob = Utilities.newBlob(decoded, type, "proof_" + key + "_" + app.email);
            const file = DriveApp.createFile(blob);
            file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
            proofs[key] = file.getDownloadUrl(); // Replace Base64 with Drive URL
          }
        }
        app.taskProofs = proofs;
        
        ss.getSheetByName(APPS_SHEET).appendRow([app.id, app.email, app.status, JSON.stringify(app), app.submittedAt]);
        return ContentService.createTextOutput(JSON.stringify({ success: true, app: app }));
      }
      
      if (action === 'update_status') {
        const sheet = ss.getSheetByName(APPS_SHEET);
        const data = sheet.getDataRange().getValues();
        for (let i = 1; i < data.length; i++) {
          if (data[i][0] == body.id) {
            let appData = JSON.parse(data[i][3]);
            appData.status = body.status;
            sheet.getRange(i + 1, 3).setValue(body.status);
            sheet.getRange(i + 1, 4).setValue(JSON.stringify(appData));
            break;
          }
        }
        return ContentService.createTextOutput(JSON.stringify({ success: true }));
      }

      if (action === 'generate_code') {
        const code = body.data;
        ss.getSheetByName(CODES_SHEET).appendRow([code.id, code.code, code.email, code.applicationId, code.used, code.generatedAt]);
        // Send Email Here if desired using MailApp.sendEmail()
        return ContentService.createTextOutput(JSON.stringify({ success: true }));
      }
      
      if (action === 'update_config') {
        const sheet = ss.getSheetByName(CONFIG_SHEET);
        sheet.clearContents();
        sheet.appendRow(["JSON_DATA"]);
        sheet.appendRow([JSON.stringify(body.data)]);
        return ContentService.createTextOutput(JSON.stringify({ success: true }));
      }
      
      if (action === 'use_code') {
         const sheet = ss.getSheetByName(CODES_SHEET);
         const data = sheet.getDataRange().getValues();
         let found = false;
         for (let i = 1; i < data.length; i++) {
            if (data[i][1] == body.code && data[i][4] == false) {
               sheet.getRange(i + 1, 5).setValue(true); // Set Used to TRUE
               found = true;
               break;
            }
         }
         return ContentService.createTextOutput(JSON.stringify({ success: true, valid: found }));
      }

    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }));
    }
  }

  function doGet(e) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const action = e.parameter.action;
    
    if (action === 'get_config') {
       const sheet = ss.getSheetByName(CONFIG_SHEET);
       const val = sheet.getRange(2, 1).getValue();
       return ContentService.createTextOutput(val || "{}");
    }
    
    if (action === 'get_applications') {
       const sheet = ss.getSheetByName(APPS_SHEET);
       const data = sheet.getDataRange().getValues();
       const apps = [];
       for (let i = 1; i < data.length; i++) {
          if(data[i][3]) apps.push(JSON.parse(data[i][3]));
       }
       return ContentService.createTextOutput(JSON.stringify(apps));
    }
    
    if (action === 'get_codes') {
       const sheet = ss.getSheetByName(CODES_SHEET);
       const data = sheet.getDataRange().getValues();
       const codes = [];
       for (let i = 1; i < data.length; i++) {
          codes.push({
             id: data[i][0],
             code: data[i][1],
             email: data[i][2],
             applicationId: data[i][3],
             used: data[i][4],
             generatedAt: data[i][5]
          });
       }
       return ContentService.createTextOutput(JSON.stringify(codes));
    }
    
    return ContentService.createTextOutput(JSON.stringify({ error: "Invalid Action" }));
  }
  --- END APPS SCRIPT ---
*/

// Keys for LocalStorage
const APPS_KEY = 'blink_applications';
const CODES_KEY = 'blink_codes';
const AUTH_KEY = 'blink_admin_auth';
const CONFIG_KEY = 'blink_class_config';
const DB_URL_KEY = 'blink_db_url';

// Helper to simulate delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const MockService = {
  // --- Database Configuration ---
  getDbUrl: (): string | null => {
     return localStorage.getItem(DB_URL_KEY);
  },

  setDbUrl: (url: string) => {
     localStorage.setItem(DB_URL_KEY, url);
  },

  // --- API Helper ---
  
  callScript: async (action: string, method: 'GET' | 'POST', data?: any) => {
    const url = MockService.getDbUrl();
    if (!url) throw new Error("No DB URL Configured");
    
    if (method === 'GET') {
       const res = await fetch(`${url}?action=${action}`);
       return await res.json();
    } else {
       // Using no-cors might be needed for simple posts if not properly set up, 
       // but typically we want the response, so Apps Script must serve correct CORS headers.
       // The provided Apps Script usually handles this via ContentService.
       const res = await fetch(url, {
         method: 'POST',
         body: JSON.stringify({ action, data })
       });
       return await res.json();
    }
  },

  // --- Config ---

  getClassConfig: async (): Promise<ClassConfig> => {
    const dbUrl = MockService.getDbUrl();
    if (dbUrl) {
       try {
         const data = await MockService.callScript('get_config', 'GET');
         if (data && data.title) return data;
         return DEFAULT_CLASS_INFO;
       } catch (e) { console.error(e); return DEFAULT_CLASS_INFO; }
    }

    await delay(300);
    const stored = localStorage.getItem(CONFIG_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_CLASS_INFO;
  },

  updateClassConfig: async (config: ClassConfig): Promise<void> => {
    const dbUrl = MockService.getDbUrl();
    if (dbUrl) {
        await MockService.callScript('update_config', 'POST', config);
        return;
    }

    await delay(500);
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  },

  // --- Applications ---
  
  getApplications: async (): Promise<Application[]> => {
    const dbUrl = MockService.getDbUrl();
    if (dbUrl) {
       return await MockService.callScript('get_applications', 'GET');
    }

    await delay(500);
    const stored = localStorage.getItem(APPS_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  getApplicationById: async (id: string): Promise<Application | undefined> => {
    // Inefficient for remote DB but keeping consistent API
    const apps = await MockService.getApplications();
    return apps.find((a) => a.id === id);
  },

  submitApplication: async (data: Omit<Application, 'id' | 'status' | 'submittedAt'>): Promise<Application> => {
    const newApp: Application = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      status: ApplicationStatus.PENDING,
      submittedAt: new Date().toISOString(),
    };

    const dbUrl = MockService.getDbUrl();
    if (dbUrl) {
       const res = await MockService.callScript('submit_application', 'POST', newApp);
       return res.app || newApp;
    }

    await delay(800);
    const apps = await MockService.getApplications();
    // For local mock, we just store base64 string directly
    localStorage.setItem(APPS_KEY, JSON.stringify([newApp, ...apps]));
    return newApp;
  },

  updateApplicationStatus: async (id: string, status: ApplicationStatus): Promise<void> => {
    const dbUrl = MockService.getDbUrl();
    if (dbUrl) {
       await MockService.callScript('update_status', 'POST', { id, status });
       return;
    }

    await delay(400);
    const apps = await MockService.getApplications();
    const updated = apps.map((app) => (app.id === id ? { ...app, status } : app));
    localStorage.setItem(APPS_KEY, JSON.stringify(updated));
  },

  // --- Codes ---

  generateCode: async (applicationId: string, email: string): Promise<InviteCode> => {
    const newCode: InviteCode = {
      id: Math.random().toString(36).substr(2, 9),
      code: `TCP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      email,
      applicationId,
      used: false,
      generatedAt: new Date().toISOString(),
    };

    const dbUrl = MockService.getDbUrl();
    if (dbUrl) {
       await MockService.callScript('generate_code', 'POST', newCode);
       return newCode;
    }

    await delay(600);
    const codes = await MockService.getCodes();
    
    const existing = codes.find(c => c.applicationId === applicationId);
    if (existing) return existing;

    localStorage.setItem(CODES_KEY, JSON.stringify([...codes, newCode]));
    return newCode;
  },

  getCodes: async (): Promise<InviteCode[]> => {
    const dbUrl = MockService.getDbUrl();
    if (dbUrl) {
       return await MockService.callScript('get_codes', 'GET');
    }

    const stored = localStorage.getItem(CODES_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  validateAndUseCode: async (codeStr: string): Promise<boolean> => {
    const dbUrl = MockService.getDbUrl();
    if (dbUrl) {
       const res = await MockService.callScript('use_code', 'POST', { code: codeStr });
       return res.valid;
    }

    await delay(800);
    const codes = await MockService.getCodes();
    const codeIndex = codes.findIndex((c) => c.code === codeStr && !c.used);

    if (codeIndex === -1) {
      return false; // Invalid or used
    }

    codes[codeIndex].used = true;
    localStorage.setItem(CODES_KEY, JSON.stringify(codes));
    return true;
  },

  // --- Auth ---

  isAdminAuthenticated: (): boolean => {
    return localStorage.getItem(AUTH_KEY) === 'true';
  },

  loginAdmin: async (password: string): Promise<boolean> => {
    await delay(500);
    if (password === 'COMPASS') {
      localStorage.setItem(AUTH_KEY, 'true');
      return true;
    }
    return false;
  },

  logoutAdmin: () => {
    localStorage.removeItem(AUTH_KEY);
  }
};