import { Application, ApplicationStatus, InviteCode, ClassConfig, DEFAULT_CLASS_INFO } from '../types';

/* 
  === GOOGLE APPS SCRIPT BACKEND CODE ===
  (Unchanged logic for brevity, but note that remote script would need similar updates for message handling)
*/

// Keys for LocalStorage
const APPS_KEY = 'tcp_applications';
const CODES_KEY = 'tcp_codes';
const AUTH_KEY = 'tcp_admin_auth';
// Updated key version to force refresh of config on devices with old cached state
const CONFIG_KEY = 'tcp_class_config_v14';
const DB_URL_KEY = 'tcp_db_url';

// Helper to simulate delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper for robust fetch with retry
const fetchWithRetry = async (url: string, options?: RequestInit, retries = 3, backoff = 500): Promise<Response> => {
  try {
    const res = await fetch(url, options);
    // If 5xx error, throw to trigger retry (unless 500 is valid for app logic, but usually transient)
    // Google Apps Script might return 500 for internal errors
    if (!res.ok && res.status >= 500) {
      throw new Error(`Server error: ${res.status}`);
    }
    return res;
  } catch (err) {
    if (retries <= 0) throw err;
    console.warn(`Fetch failed, retrying (${retries} left)...`, err);
    await delay(backoff);
    return fetchWithRetry(url, options, retries - 1, backoff * 2);
  }
};

// --- Caching System ---
class SimpleCache<T> {
    private cache: Record<string, { data: T; expires: number }> = {};
    private storageKeyPrefix = 'tcp_cache_';

    constructor(private ttl: number = 5 * 60 * 1000) {} // Default 5 mins

    get(key: string): T | null {
        // Check Memory Cache
        const memEntry = this.cache[key];
        if (memEntry && memEntry.expires > Date.now()) {
            return memEntry.data;
        }

        // Check LocalStorage
        const stored = localStorage.getItem(this.storageKeyPrefix + key);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (parsed.expires > Date.now()) {
                    // Rehydrate memory cache
                    this.cache[key] = parsed;
                    return parsed.data;
                }
            } catch (e) {
                console.warn('Cache parse error', e);
            }
        }
        return null;
    }

    set(key: string, data: T) {
        const entry = {
            data,
            expires: Date.now() + this.ttl
        };
        this.cache[key] = entry;
        localStorage.setItem(this.storageKeyPrefix + key, JSON.stringify(entry));
    }

    clear(key: string) {
        delete this.cache[key];
        localStorage.removeItem(this.storageKeyPrefix + key);
    }
}

const configCache = new SimpleCache<ClassConfig>(10 * 60 * 1000); // 10 mins for config
const appCache = new SimpleCache<Application[]>(2 * 60 * 1000); // 2 mins for apps

export const MockService = {
  // --- Database Configuration ---
  getDbUrl: (): string | null => {
     return localStorage.getItem(DB_URL_KEY) || (import.meta as any).env?.VITE_DB_URL || null;
  },

  setDbUrl: (url: string) => {
     localStorage.setItem(DB_URL_KEY, url);
  },

  // --- API Helper ---
  
  callScript: async (action: string, method: 'GET' | 'POST', data?: any) => {
    const url = MockService.getDbUrl();
    if (!url) throw new Error("No DB URL Configured");
    
    if (method === 'GET') {
       const res = await fetchWithRetry(`${url}?action=${action}`);
       return await res.json();
    } else {
       // Google Apps Script requires text/plain to avoid preflight OPTIONS check issues
       const res = await fetchWithRetry(url, {
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

  getClassConfig: async (forceRefresh = false): Promise<ClassConfig> => {
    // Check Cache first
    if (!forceRefresh) {
        const cached = configCache.get('config');
        if (cached) return cached;
    }

    const dbUrl = MockService.getDbUrl();
    let remoteData = null;

    if (dbUrl) {
       try {
         remoteData = await MockService.callScript('get_config', 'GET');
       } catch (e) { 
         console.warn("Failed to fetch remote config, falling back to local:", e); 
         // Fallback will happen below
       }
    }

    if (remoteData && remoteData.title) {
        configCache.set('config', remoteData);
        return remoteData;
    }

    // Local fallback
    await delay(300);
    const stored = localStorage.getItem(CONFIG_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_CLASS_INFO;
  },

  updateClassConfig: async (config: ClassConfig): Promise<void> => {
    const dbUrl = MockService.getDbUrl();
    
    // Optimistic Update
    configCache.set('config', config);
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));

    if (dbUrl) {
        await MockService.callScript('update_config', 'POST', config);
        return;
    }

    await delay(500);
  },

  // --- Applications ---
  
  getApplications: async (forceRefresh = false): Promise<Application[]> => {
    if (!forceRefresh) {
        const cached = appCache.get('all_apps');
        if (cached) return cached;
    }

    const dbUrl = MockService.getDbUrl();
    if (dbUrl) {
       const data = await MockService.callScript('get_applications', 'GET');
       appCache.set('all_apps', data);
       return data;
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
    return MockService.updateApplication(id, { status });
  },

  updateApplication: async (id: string, updates: Partial<Application>): Promise<void> => {
    const dbUrl = MockService.getDbUrl();
    if (dbUrl) {
       const res = await MockService.callScript('update_application', 'POST', { id, updates });
       if (!res.success) {
         throw new Error(res.message || "Failed to update application remotely");
       }
       return;
    }

    await delay(400);
    const apps = await MockService.getApplications();
    const updated = apps.map((app) => (app.id === id ? { ...app, ...updates } : app));
    localStorage.setItem(APPS_KEY, JSON.stringify(updated));
  },

  batchApproveApplications: async (ids: string[]): Promise<{ success: boolean; count: number }> => {
    const dbUrl = MockService.getDbUrl();
    if (dbUrl) {
       const res = await MockService.callScript('batch_approve', 'POST', { ids });
       if (!res.success) {
         throw new Error(res.message || "Remote batch approval failed");
       }
       return { success: true, count: res.count };
    }

    // Local simulation
    await delay(1000);
    const apps = await MockService.getApplications();
    const updatedApps = [...apps];
    let count = 0;
    
    for (const id of ids) {
        const index = updatedApps.findIndex(a => a.id === id);
        if (index !== -1 && updatedApps[index].status === ApplicationStatus.PENDING) {
            updatedApps[index] = { ...updatedApps[index], status: ApplicationStatus.APPROVED };
            await MockService.generateCode(updatedApps[index].id, updatedApps[index].email);
            count++;
        }
    }
    
    localStorage.setItem(APPS_KEY, JSON.stringify(updatedApps));
    return { success: true, count };
  },

  batchSetWave: async (ids: string[], wave: number): Promise<{ success: boolean; count: number }> => {
    const dbUrl = MockService.getDbUrl();
    if (dbUrl) {
       // Ideally we would have a remote endpoint for this
       // For now, assume local fallback if not implemented remotely, or implement remote call
       // const res = await MockService.callScript('batch_set_wave', 'POST', { ids, wave });
       // return res;
    }

    await delay(500);
    const apps = await MockService.getApplications();
    const updatedApps = apps.map(app => ids.includes(app.id) ? { ...app, wave } : app);
    localStorage.setItem(APPS_KEY, JSON.stringify(updatedApps));
    return { success: true, count: ids.length };
  },

  getCapacityStats: async (): Promise<{ capacity: number; approved: number; remaining: number }> => {
    const config = await MockService.getClassConfig();
    const apps = await MockService.getApplications();
    const approved = apps.filter(a => a.status === ApplicationStatus.APPROVED).length;
    const capacity = config.capacity || 50;
    
    return {
        capacity,
        approved,
        remaining: Math.max(0, capacity - approved)
    };
  },

  checkForDuplicates: async (email: string, ip?: string): Promise<{ isDuplicate: boolean; existingId?: string }> => {
    const apps = await MockService.getApplications();
    const match = apps.find(a => a.email.toLowerCase() === email.toLowerCase());
    return {
        isDuplicate: !!match,
        existingId: match?.id
    };
  },


  sendEmail: async (recipient: string, subject: string, body: string): Promise<{ success: boolean; message?: string }> => {
    const dbUrl = MockService.getDbUrl();
    if (dbUrl) {
       const res = await MockService.callScript('send_email', 'POST', { recipient, subject, body });
       return res;
    }
    
    // Local simulation
    await delay(800);
    console.log(`[MOCK EMAIL] To: ${recipient}\nSubject: ${subject}\nBody: ${body}`);
    return { success: true };
  },

  batchSendEmail: async (recipients: string[], subject: string, body: string): Promise<{ success: boolean; sent: number; errors?: string[] }> => {
    const dbUrl = MockService.getDbUrl();
    if (dbUrl) {
       const res = await MockService.callScript('batch_send_email', 'POST', { recipients, subject, body });
       return res;
    }

    // Local simulation
    await delay(1500);
    console.log(`[MOCK BATCH EMAIL] To ${recipients.length} recipients\nSubject: ${subject}\nBody: ${body}`);
    return { success: true, sent: recipients.length };
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
      try {
        const res = await MockService.callScript('use_code', 'POST', { code: codeStr.trim() });
        // The script returns { valid: boolean, message?: string }
        if (!res.valid) {
          // Pass the exact message from the backend to the UI
          return { valid: false, message: res.message || "Invalid or expired code (Remote)" };
        }
        return { valid: true };
      } catch (e) {
        return { valid: false, message: "Connection error: " + (e as Error).message };
      }
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