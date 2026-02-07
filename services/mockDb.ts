import { Application, ApplicationStatus, InviteCode, ClassConfig, DEFAULT_CLASS_INFO } from '../types';

/* 
  === GOOGLE APPS SCRIPT BACKEND CODE ===
  (Unchanged logic for brevity, but note that remote script would need similar updates for message handling)
*/

// Keys for LocalStorage
const APPS_KEY = 'blink_applications';
const CODES_KEY = 'blink_codes';
const AUTH_KEY = 'blink_admin_auth';
// Updated key version to force refresh of config on devices with old cached state
const CONFIG_KEY = 'blink_class_config_v2';
const DB_URL_KEY = 'blink_db_url';

// Helper to simulate delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const MockService = {
  // --- Database Configuration ---
  getDbUrl: (): string | null => {
     return localStorage.getItem(DB_URL_KEY) || import.meta.env.VITE_DB_URL || null;
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
       // Google Apps Script requires text/plain to avoid preflight OPTIONS check issues
       const res = await fetch(url, {
         method: 'POST',
         body: JSON.stringify({ action, data }),
         headers: {
            "Content-Type": "text/plain;charset=utf-8",
         },
       });
       return await res.json();
    }
  },

  // --- Helpers ---

  parseSessionEnd: (dateStr?: string, timeStr?: string): Date | null => {
    if (!dateStr || !timeStr) return null;
    try {
      // Extract end time (e.g. "2:00 PM" from "10:00 AM - 2:00 PM PST")
      // Matches "10:00 AM" or "14:00"
      const times = timeStr.match(/(\d{1,2}:\d{2}\s?(?:AM|PM)?)/gi);
      if (!times || times.length < 1) return null;

      // Use the last match as the end time
      const endTimeStr = times[times.length - 1]; 
      const endDateTimeStr = `${dateStr} ${endTimeStr}`;
      
      const date = new Date(endDateTimeStr);
      if (isNaN(date.getTime())) return null;
      
      return date;
    } catch (e) {
      return null;
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
    // Check if code exists first to enforce 1-to-1
    const existingCodes = await MockService.getCodes();
    const existing = existingCodes.find(c => c.applicationId === applicationId);
    
    if (existing) {
        console.log(`[MOCK EMAIL SERVICE] Re-sending Email to ${email} with existing code: ${existing.code}`);
        return existing;
    }

    const newCode: InviteCode = {
      id: Math.random().toString(36).substr(2, 9),
      code: `TCP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      email,
      applicationId,
      used: false, // Ensures it is not expired until used
      generatedAt: new Date().toISOString(),
    };

    const dbUrl = MockService.getDbUrl();
    if (dbUrl) {
       await MockService.callScript('generate_code', 'POST', newCode);
       console.log(`[MOCK EMAIL SERVICE] Requesting Remote to send Email to ${email}`);
       return newCode;
    }

    await delay(600);
    
    console.log(`[MOCK EMAIL SERVICE] Sending Email to ${email} with code: ${newCode.code}`);
    
    // Refresh list just in case of race condition in mock
    const currentCodes = await MockService.getCodes();
    localStorage.setItem(CODES_KEY, JSON.stringify([...currentCodes, newCode]));
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

  validateAndUseCode: async (codeStr: string): Promise<{ valid: boolean; message?: string }> => {
    const dbUrl = MockService.getDbUrl();
    if (dbUrl) {
       const res = await MockService.callScript('use_code', 'POST', { code: codeStr });
       return { valid: res.valid, message: res.valid ? undefined : "Invalid or expired code (Remote)" };
    }

    await delay(800);
    const codes = await MockService.getCodes();
    const codeEntry = codes.find((c) => c.code === codeStr);

    if (!codeEntry) {
      return { valid: false, message: "Invalid invitation code. Please check your email and try again." };
    }

    // Check Expiration (Code expires only after the LAST session ends)
    const config = await MockService.getClassConfig();
    let lastSessionEnd: Date | null = null;

    // Check legacy single session
    if (config.date && config.time) {
        lastSessionEnd = MockService.parseSessionEnd(config.date, config.time);
    }

    // Check multiple sessions (if any, they might override or extend)
    if (config.sessions && config.sessions.length > 0) {
        config.sessions.forEach(session => {
            const end = MockService.parseSessionEnd(session.date, session.time);
            if (end && (!lastSessionEnd || end > lastSessionEnd)) {
                lastSessionEnd = end;
            }
        });
    }

    // If we have a valid end time, check if we are past it
    if (lastSessionEnd) {
        const now = new Date();
        // Add a small buffer (e.g. 1 hour) to allow for late access or timezone drift?
        // User said "till the session they are going for ends".
        // Let's strictly enforce end time but maybe strictness depends on preference.
        // I'll stick to strict end time.
        if (now > lastSessionEnd) {
             return { valid: false, message: "This class session has ended. Access code expired." };
        }
    }

    // Allow code reuse so users can log in multiple times
    // if (codeEntry.used) {
    //   return { valid: false, message: "This code has already been redeemed. Each code can only be used once." };
    // }

    // Mark as used (if not already)
    if (!codeEntry.used) {
        const updatedCodes = codes.map(c => c.code === codeStr ? { ...c, used: true } : c);
        localStorage.setItem(CODES_KEY, JSON.stringify(updatedCodes));
    }

    return { valid: true };
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
  },

  // --- Reminders ---

  triggerReminders: async (): Promise<{ sent: number }> => {
    const dbUrl = MockService.getDbUrl();
    if (dbUrl) {
       const res = await MockService.callScript('trigger_reminders', 'POST');
       return res;
    }

    // Local simulation
    await delay(1000);
    const codes = await MockService.getCodes();
    const usedCodes = codes.filter(c => c.used);
    
    console.log(`[MOCK REMINDER SERVICE] Sending reminders to ${usedCodes.length} users.`);
    return { sent: usedCodes.length };
  }
};