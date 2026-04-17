import { Application, ApplicationStatus, InviteCode, ClassConfig, DEFAULT_CLASS_INFO } from '../types';
// @ts-ignore
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Keys for LocalStorage fallbacks
const APPS_KEY = 'tcp_applications';
const CONFIG_KEY = 'tcp_class_config_v14';
const ONBOARDING_KEY = 'tcp_member_onboarding';
const SUPABASE_URL_KEY = 'tcp_supabase_url';
const SUPABASE_ANON_KEY = 'tcp_supabase_anon_key';

// Helper to simulate delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let _supabase: any = null;

const getSupabase = () => {
    if (_supabase) return _supabase;
    
    // Prioritize Env variables, then LocalStorage (Fallback)
    const url = (import.meta as any).env?.VITE_SUPABASE_URL || localStorage.getItem(SUPABASE_URL_KEY);
    const key = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || localStorage.getItem(SUPABASE_ANON_KEY);
    
    // Validate that url and key are present and not placeholders
    if (url && key && !url.includes('your_supabase_url') && !key.includes('your_supabase_anon_key')) {
        _supabase = createClient(url, key);
        return _supabase;
    }
    return null;
};

export const MockService = {
  // --- Database Configuration ---
  getDbUrl: (): string | null => {
     return localStorage.getItem(SUPABASE_URL_KEY) || null;
  },

  // --- Config ---

  getClassConfig: async (forceRefresh = false): Promise<ClassConfig> => {
    const supabase = getSupabase();
    if (supabase) {
        const { data, error } = await supabase
            .from('app_config')
            .select('value')
            .eq('key', 'site_settings')
            .single();
        
        if (data && data.value) return data.value;
    }

    const stored = localStorage.getItem(CONFIG_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_CLASS_INFO;
  },

  getClassConfigSync: (): ClassConfig => {
    const stored = localStorage.getItem(CONFIG_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_CLASS_INFO;
  },

  updateClassConfig: async (config: ClassConfig): Promise<void> => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    
    const supabase = getSupabase();
    if (supabase) {
        await supabase
            .from('app_config')
            .upsert({ key: 'site_settings', value: config });
    }
    await delay(300);
  },

  // --- Applications ---
  
  getApplications: async (forceRefresh = false): Promise<Application[]> => {
    const supabase = getSupabase();
    if (supabase) {
        const { data, error } = await supabase
            .from('applications')
            .select('*')
            .order('submitted_at', { ascending: false });
        
        if (data) {
            // Transform snake_case from DB to camelCase for App
            return data.map((a: any) => ({
                ...a,
                fullName: a.full_name,
                twitterHandle: a.twitter_handle,
                taskProofs: a.task_proofs,
                submittedAt: a.submitted_at
            }));
        }
    }

    const stored = localStorage.getItem(APPS_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  submitApplication: async (data: Omit<Application, 'id' | 'status' | 'submittedAt'>): Promise<Application> => {
    const newApp: Application = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      status: ApplicationStatus.PENDING,
      submittedAt: new Date().toISOString(),
    };

    const supabase = getSupabase();
    if (supabase) {
        await supabase.from('applications').insert({
            id: newApp.id,
            email: newApp.email,
            full_name: newApp.fullName,
            twitter_handle: newApp.twitterHandle,
            why_join: newApp.whyJoin,
            task_proofs: newApp.taskProofs,
            status: newApp.status,
            wave: newApp.wave,
            submitted_at: newApp.submittedAt
        });
    }

    const apps = await MockService.getApplications();
    localStorage.setItem(APPS_KEY, JSON.stringify([newApp, ...apps]));
    return newApp;
  },

  updateApplication: async (id: string, updates: Partial<Application>): Promise<void> => {
    const supabase = getSupabase();
    if (supabase) {
        const dbUpdates: any = { ...updates };
        if (updates.fullName) dbUpdates.full_name = updates.fullName;
        if (updates.twitterHandle) dbUpdates.twitter_handle = updates.twitterHandle;
        
        await supabase.from('applications').update(dbUpdates).eq('id', id);
    }

    const apps = await MockService.getApplications();
    const updated = apps.map((app) => (app.id === id ? { ...app, ...updates } : app));
    localStorage.setItem(APPS_KEY, JSON.stringify(updated));
  },

  batchApproveApplications: async (ids: string[]): Promise<{ success: boolean; count: number }> => {
    const supabase = getSupabase();
    if (supabase) {
        await supabase.from('applications')
            .update({ status: ApplicationStatus.APPROVED })
            .in('id', ids);
    }

    const apps = await MockService.getApplications();
    const updatedApps = apps.map(app => ids.includes(app.id) ? { ...app, status: ApplicationStatus.APPROVED } : app);
    localStorage.setItem(APPS_KEY, JSON.stringify(updatedApps));
    return { success: true, count: ids.length };
  },

  // --- Member Onboarding ---
  
  getMemberOnboarding: async (forceRefresh = false): Promise<any[]> => {
    const supabase = getSupabase();
    if (supabase) {
        const { data, error } = await supabase
            .from('member_onboarding')
            .select('*')
            .order('submitted_at', { ascending: false })
            .limit(10000);
        
        if (data) {
            // Transform snake_case to camelCase
            return data.map((m: any) => ({
                ...m,
                fullName: m.full_name,
                telegramUsername: m.telegram_username,
                discordUsername: m.discord_username,
                xUsername: m.x_username,
                stateRegion: m.state_region,
                maritalStatus: m.marital_status,
                ageRange: m.age_range,
                howLongInTcc: m.how_long_in_tcc,
                joinTccDate: m.join_tcc_date,
                startWeb3JourneyDate: m.start_web3_journey_date,
                dobDay: m.dob_day,
                dobMonth: m.dob_month,
                dobYear: m.dob_year,
                otherSkills: m.other_skills,
                skillLevel: m.skill_level,
                knowledgeableTools: m.knowledgeable_tools,
                hasCertifications: m.has_certifications,
                certificationsList: m.certifications_list,
                hasPortfolio: m.has_portfolio,
                portfolioLink: m.portfolio_link,
                workedWithWeb3Brand: m.worked_with_web3_brand,
                web3Role: m.web3_role,
                web3Brands: m.web3_brands,
                contributionAreas: m.contribution_areas,
                otherContributionAreas: m.other_contribution_areas,
                otherContributionAreas: m.other_contribution_areas,
                contributionCapacity: m.contribution_capacity,
                currentStatus: m.current_status,
                openToTeaching: m.open_to_teaching,
                hasNetworkAccess: m.has_network_access,
                networkDescription: m.network_description,
                submittedAt: m.submitted_at,
                // Explicitly copy keys that don't need transformation to ensure they are handled if missing
                email: m.email || '',
                country: m.country || '',
                inspiration: m.inspiration || '',
                expectations: m.expectations || '',
                skills: Array.isArray(m.skills) ? m.skills : m.skills ? m.skills.split('|') : [],
                contributionAreas: Array.isArray(m.contribution_areas) ? m.contribution_areas : m.contribution_areas ? m.contribution_areas.split('|') : []
            }));
        }
    }

    const stored = localStorage.getItem(ONBOARDING_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  submitMemberOnboarding: async (data: any): Promise<any> => {
    const newMember = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      submittedAt: new Date().toISOString(),
    };

    const supabase = getSupabase();
    if (supabase) {
        const dbData = {
            id: newMember.id,
            full_name: newMember.fullName,
            email: newMember.email,
            telegram_username: newMember.telegramUsername,
            discord_username: newMember.discordUsername,
            x_username: newMember.xUsername,
            country: newMember.country,
            state_region: newMember.stateRegion,
            marital_status: newMember.maritalStatus,
            age_range: newMember.ageRange,
            how_long_in_tcc: newMember.howLongInTcc,
            join_tcc_date: newMember.joinTccDate,
            start_web3_journey_date: newMember.startWeb3JourneyDate,
            dob_day: newMember.dobDay,
            dob_month: newMember.dobMonth,
            dob_year: newMember.dobYear,
            inspiration: newMember.inspiration,
            expectations: newMember.expectations,
            skills: newMember.skills,
            other_skills: newMember.otherSkills,
            skill_level: newMember.skillLevel,
            knowledgeable_tools: newMember.knowledgeableTools,
            has_certifications: newMember.hasCertifications,
            certifications_list: newMember.certificationsList,
            has_portfolio: newMember.hasPortfolio,
            portfolio_link: newMember.portfolioLink,
            worked_with_web3_brand: newMember.workedWithWeb3Brand,
            web3_role: newMember.web3Role,
            web3_brands: newMember.web3Brands,
            contribution_areas: newMember.contributionAreas,
            other_contribution_areas: newMember.otherContributionAreas,
            contribution_capacity: newMember.contributionCapacity,
            current_status: newMember.currentStatus,
            open_to_teaching: newMember.openToTeaching,
            has_network_access: newMember.hasNetworkAccess,
            network_description: newMember.networkDescription,
            submitted_at: newMember.submittedAt
        };
        await supabase.from('member_onboarding').insert(dbData);
    }

    const members = await MockService.getMemberOnboarding();
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify([newMember, ...members]));
    return newMember;
  },

  // --- Auth & Legacy (Stay local) ---
  isAdminAuthenticated: (): boolean => localStorage.getItem('tcp_admin_auth') === 'true',
  loginAdmin: async (password: string): Promise<boolean> => {
    await delay(300);
    if (password === 'COMPASS') {
      localStorage.setItem('tcp_admin_auth', 'true');
      return true;
    }
    return false;
  },
  logoutAdmin: () => localStorage.removeItem('tcp_admin_auth'),
  
  // Stubs for remaining logic to keep UI working
  batchSetWave: async (ids: string[], wave: number) => {
    const apps = await MockService.getApplications();
    const updated = apps.map(a => ids.includes(a.id) ? { ...a, wave } : a);
    localStorage.setItem(APPS_KEY, JSON.stringify(updated));
    return { success: true, count: ids.length };
  },
  generateCode: async () => ({ id: '1', code: 'PRO-123' }),
  triggerReminders: async () => ({ sent: 0 }),
  batchSendEmail: async () => ({ success: true, sent: 0 }),
  getCodes: async () => [],
  validateAndUseCode: async (code: string) => ({ 
    valid: true, 
    message: 'Code verified successfully.' 
  }),
  getCapacityStats: async () => {
    const apps = await MockService.getApplications();
    const config = MockService.getClassConfigSync();
    const approved = apps.filter(a => a.status === ApplicationStatus.APPROVED).length;
    return {
      capacity: config.capacity || 50,
      approved: approved,
      remaining: (config.capacity || 50) - approved
    };
  }
};