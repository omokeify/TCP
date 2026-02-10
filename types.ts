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
  status: ApplicationStatus;
  submittedAt: string; // ISO Date string
  referrerId?: string; // Tracking who referred this applicant
  adminNote?: string;
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
  type: 'video' | 'link' | 'stream' | 'community' | 'document';
}

export interface ClassSession {
  id: string;
  title: string;
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
  tutor?: {
    name: string;
    avatarUrl: string;
  };
}

export interface ClassConfig {
  title: string;
  description: string;
  acceptingApplications: boolean;
  tasks: TaskConfig[];
  questSets?: QuestSet[];
  resources: ClassResource[];
  sessions?: ClassSession[]; // New multiple sessions support
  // Portal Specific Fields (Legacy/Global)
  date?: string;
  time?: string;
  location?: string;
  instructor?: string;
  extraNotes?: string;
  lastUpdated?: string;
  
  // Custom Labels for Standard Fields
  nameLabel?: string;
  emailLabel?: string;
  whyJoinLabel?: string;
  stats?: {
    approved: number;
    total: number;
  };
  capacity?: number;
}

export const DEFAULT_CLASS_INFO: ClassConfig = {
  title: "Vibe Coding Class",
  description: "The Builder Mindset: How AI Actually Builds & What you're Doing Wrong.\n\nINPUT → LOGIC → DATA → OUTPUT for every app",
  acceptingApplications: true,
  date: "October 15, 2030",
  time: "2:00 PM EST",
  location: "Google Meet (Link sent upon acceptance)",
  instructor: "Fredy",
  extraNotes: "Additional info visible only to accepted students in the portal.",
  capacity: 50,
  sessions: [
     {
        id: "default-1",
        title: "Main Session",
        date: "October 15, 2030",
        time: "2:00 PM EST",
        location: "Google Meet (Link sent upon acceptance)",
        instructor: "Fredy"
     }
  ],
  questSets: [
    {
      id: "vibe-coding",
      title: "Vibe Coding",
      description: "Embrace the flow state of AI-assisted development. Learn to guide LLMs to build complex systems while you maintain the creative vision.",
      category: "Methodology",
      level: "Advanced",
      tutor: {
        name: "Cursor",
        avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDYJ91P9Vny1TW_oWCNEHPcSOm010AUKW5oTz5dGWCy4cT9FWoY3AVTvr5Aocascp6iC1xvm0-DkQr5mrAnDKreo96AXENEhD3ypc4irBipe6ph62tpUyurPMzn0luGhIkTno_s437cQ9H2wH8H0IZKqBJ1Omu98br1stFffblADeWCs4JFdZSvk3ZiDEGgldGTEVcW2PaaDifSITGiDt9jZdqs7e9ktBQQK6UbrIOaCHzrQDDISOBCe6laMwYdXU3sljVkL_4DtQsG"
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
  tasks: [
    {
      id: "t2",
      description: "Share why you want to join (min 50 words)",
      requiresProof: false,
      proofType: "text"
    }
  ],
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