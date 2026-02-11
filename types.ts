export enum ApplicationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface Application {
  id: string;
  email: string;
  fullName: string;
  twitterHandle?: string; // Kept for backward compatibility or as a standard field
  whyJoin: string;
  taskProofs: Record<string, string>; // Map of taskId -> user input
  proofStatuses?: Record<string, 'approved' | 'rejected'>; // Map of taskId -> status
  status: ApplicationStatus;
  submittedAt: string; // ISO Date string
  referrerId?: string; // Tracking who referred this applicant
  adminNote?: string;
  wave?: number; // Batch number for phased access
}

export interface InviteCode {
  id: string;
  code: string;
  email: string;
  applicationId: string;
  used: boolean;
  generatedAt: string;
}

export interface TaskConfig {
  id: string;
  description: string;
  link?: string; // Optional link to be displayed with the description
  requiresProof: boolean;
  proofLabel?: string;
  proofType: 'text' | 'link' | 'username' | 'image' | 'yes_no';
}

export interface ClassResource {
  id: string;
  title: string;
  description: string;
  url: string;
  type: 'video' | 'link' | 'stream' | 'community' | 'document' | 'github';
}

export interface ClassSession {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  location: string;
  instructor: string;
  maxAttendees?: number;
}

export interface QuestSet {
  id: string;
  title: string;
  description: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  tasks: TaskConfig[];
  
  // Quest Card Specifics
  status: 'active' | 'completed' | 'draft';
  instructor?: string;
  capacity?: number;
  sessions?: ClassSession[];
  extraNotes?: string; // Added for per-quest portal notes
  
  // Custom Form Fields
  customFields?: {
      whyJoinLabel?: string;
      nameLabel?: string;
      emailLabel?: string;
  };

  // Class Content & Resources (Quest Specific)
  resources?: ClassResource[];
  modules?: LearningModule[];

  // Legacy/UI
  tutor?: {
    name: string;
    avatarUrl: string;
  };
}

export interface ClassConfig {
  title: string; // Global Brand Title
  description: string; // Global Brand Description
  acceptingApplications: boolean; // Global Kill Switch
  
  // Global Defaults (can be overridden by Quest)
  tasks: TaskConfig[]; 
  resources: ClassResource[];
  sessions?: ClassSession[]; 
  questSets?: QuestSet[];

  // Portal Specific Fields (Legacy/Global)
  date?: string;
  time?: string;
  location?: string;
  instructor?: string;
  extraNotes?: string;
  lastUpdated?: string;
  
  // Custom Labels for Standard Fields (Global Fallback)
  nameLabel?: string;
  emailLabel?: string;
  whyJoinLabel?: string;
  stats?: {
    approved: number;
    total: number;
  };
  capacity?: number;
  modules?: LearningModule[];
}

export interface LearningChallenge {
  id: string;
  title: string;
  description: string;
  proofType: 'link' | 'text' | 'image' | 'github';
  xp: number;
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  order: number;
  resources: ClassResource[];
  challenges: LearningChallenge[];
}

export const DEFAULT_CLASS_INFO: ClassConfig = {
  title: "Vibe Coding Class",
  description: "The Builder Mindset: How AI Actually Builds & What you're Doing Wrong.\n\nINPUT → LOGIC → DATA → OUTPUT for every app",
  acceptingApplications: true,
  date: "February 12, 2026",
  time: "8:00 PM EST",
  location: "Google Meet",
  instructor: "Fredy",
  extraNotes: "Join the class via the link below. Make sure you have your environment set up and ready to code!",
  capacity: 50,
  sessions: [
     {
        id: "default-1",
        title: "Main Session: Vibe Coding Workshop",
        date: "February 12, 2026",
        time: "8:00 PM EST",
        location: "https://calendar.app.google/haLz7cFBtTWtFxKD8",
        instructor: "Fredy",
        description: "The primary workshop session where we dive deep into AI-assisted development."
     }
  ],
  questSets: [
    {
      id: "vibe-coding",
      title: "Vibe Coding",
      description: "Embrace the flow state of AI-assisted development. Learn to guide LLMs to build complex systems while you maintain the creative vision.",
      category: "Methodology",
      level: "Advanced",
      status: "active",
      instructor: "Fredy",
      capacity: 50,
      sessions: [
         {
            id: "q1-s1",
            title: "Live Workshop",
            date: "February 12, 2026",
            time: "8:00 PM EST",
            location: "Google Meet",
            instructor: "Fredy"
         }
      ],
      tutor: {
        name: "Fredy",
        avatarUrl: "https://pbs.twimg.com/profile_images/1593132069639524352/7Y7dZ0jM_400x400.jpg"
      },
      tasks: [
        {
          id: "task_follow_web3frik",
          description: "Follow web3frik on X",
          link: "https://x.com/web3frik",
          requiresProof: true,
          proofType: "yes_no"
        },
        {
          id: "task_follow_d3fi",
          description: "Follow d3fi on X",
          link: "https://x.com/web3Xs",
          requiresProof: true,
          proofType: "yes_no"
        },
        {
          id: "task_follow_n1fredy",
          description: "Follow @n1fredy",
          link: "https://x.com/n1fredy",
          requiresProof: true,
          proofType: "yes_no"
        },
        {
          id: "task_repost",
          description: "Repost",
          link: "https://x.com/web3Xs/status/2019809110649147899",
          requiresProof: true,
          proofType: "link"
        },
        {
          id: "task_join_telegram",
          description: "Join Telegram",
          link: "https://t.me/web3compassx",
          requiresProof: true,
          proofLabel: "Your Telegram ID",
          proofType: "username"
        },
        {
          id: "task_join_discord",
          description: "Join Discord",
          link: "https://discord.gg/DuXDj7FHey",
          requiresProof: true,
          proofLabel: "Your discord username",
          proofType: "username"
        },
        {
          id: "task_x_username",
          description: "Your X username",
          requiresProof: true,
          proofLabel: "Your X profile link",
          proofType: "link"
        }
      ]
    }
  ],
  tasks: [], // Global tasks cleared as requested previously
  resources: [
    {
      id: "r1",
      title: "Live Class Session",
      description: "Join the weekly live stream where we dissect advanced topics. Next Call: Friday, 10:00 AM PST.",
      url: "https://meet.google.com/",
      type: "stream"
    },
    {
      id: "r2",
      title: "Community Discord",
      description: "Chat with other approved members and get direct feedback in the #exclusive channel.",
      url: "https://discord.com/",
      type: "community"
    },
    {
      id: "r3",
      title: "Course Syllabus",
      description: "Download the PDF breakdown of all 8 weeks of content.",
      url: "#",
      type: "document"
    }
  ]
};