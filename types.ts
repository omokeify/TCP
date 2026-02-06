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
  requiresProof: boolean;
  proofLabel?: string;
  proofType: 'text' | 'link' | 'username' | 'image';
}

export interface ClassConfig {
  title: string;
  description: string;
  tasks: TaskConfig[];
}

export const DEFAULT_CLASS_INFO: ClassConfig = {
  title: "Advanced React Patterns Masterclass",
  description: "An exclusive, invite-only deep dive into modern component architecture. Limited seats available.",
  tasks: [
    {
      id: "t1",
      description: "Follow @BlinkClass on Twitter",
      requiresProof: true,
      proofLabel: "Your Twitter Handle",
      proofType: "username"
    },
    {
      id: "t2",
      description: "Share why you want to join (min 50 words)",
      requiresProof: false, // This is handled by standard form, but conceptually could be here. 
      // NOTE: standard form has 'whyJoin'. We'll keep standard fields separate.
      proofType: "text"
    },
    {
      id: "t3",
      description: "Upload a screenshot of your GitHub contribution graph",
      requiresProof: true,
      proofLabel: "GitHub Graph",
      proofType: "image"
    }
  ]
};