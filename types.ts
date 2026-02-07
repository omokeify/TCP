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

export interface ClassConfig {
  title: string;
  description: string;
  acceptingApplications: boolean;
  tasks: TaskConfig[];
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
}

export const DEFAULT_CLASS_INFO: ClassConfig = {
  title: "Vibe Coding Class",
  description: "An exclusive, invite-only deep dive into modern component architecture. Limited seats available.",
  acceptingApplications: true,
  date: "October 15, 2030",
  time: "10:00 AM - 2:00 PM PST",
  location: "https://zoom.us/j/123456789",
  instructor: "Sarah Drasner (Guest)",
  extraNotes: "Please prepare your local environment with Node.js v18+ and VS Code before joining. The Zoom link will be active 15 minutes prior.",
  lastUpdated: new Date().toLocaleDateString(),
  sessions: [
     {
        id: "default-1",
        title: "Main Session",
        date: "October 15, 2030",
        time: "10:00 AM - 2:00 PM PST",
        location: "https://zoom.us/j/123456789",
        instructor: "Sarah Drasner (Guest)"
     }
  ],
  tasks: [
    {
      id: "t1",
      description: "Follow @web3frik on X",
      requiresProof: true,
      proofLabel: "Your Twitter Handle",
      proofType: "username"
    },
    {
      id: "t2",
      description: "Share why you want to join (min 50 words)",
      requiresProof: false, // This is handled by standard form
      proofType: "text"
    },
    {
      id: "vgh4hv8x4",
      description: "Follow @d3fi on X",
      requiresProof: true,
      proofType: "text"
    },
    {
      id: "2cjq2q4uw",
      description: "Follow @n1fredy",
      requiresProof: true,
      proofType: "text"
    },
    {
      id: "bwieba3zd",
      description: "Repost https://x.com/web3Xs/status/2019809110649147899",
      requiresProof: true,
      proofType: "link"
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