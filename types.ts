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
  description: "An exclusive, invite-only deep dive into modern component architecture. Limited seats available.",
  acceptingApplications: true,
  date: "October 15, 2030",
  time: "10:00 AM - 2:00 PM PST",
  location: "https://zoom.us/j/123456789",
  instructor: "Sarah Drasner (Guest)",
  extraNotes: "Please prepare your local environment with Node.js v18+ and VS Code before joining. The Zoom link will be active 15 minutes prior.",
  lastUpdated: new Date().toLocaleDateString(),
  capacity: 50,
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
          id: "t1",
          description: "Follow @web3frik on X",
          requiresProof: true,
          proofLabel: "Your Twitter Handle",
          proofType: "username"
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
      ]
    },
    {
      id: "minimalism",
      title: "Mastering Minimalism",
      description: "Learn the core principles of reductive design. Focus on white space, typography, and purposeful compositions that resonate.",
      category: "Foundation",
      level: "Beginner",
      tutor: {
        name: "Sarah",
        avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDYJ91P9Vny1TW_oWCNEHPcSOm010AUKW5oTz5dGWCy4cT9FWoY3AVTvr5Aocascp6iC1xvm0-DkQr5mrAnDKreo96AXENEhD3ypc4irBipe6ph62tpUyurPMzn0luGhIkTno_s437cQ9H2wH8H0IZKqBJ1Omu98br1stFffblADeWCs4JFdZSvk3ZiDEGgldGTEVcW2PaaDifSITGiDt9jZdqs7e9ktBQQK6UbrIOaCHzrQDDISOBCe6laMwYdXU3sljVkL_4DtQsG"
      },
      tasks: [
        {
          id: "m1",
          description: "Create a monochrome landing page design",
          requiresProof: true,
          proofType: "image",
          proofLabel: "Upload Design URL"
        },
        {
          id: "m2",
          description: "Read 'The Laws of Simplicity'",
          requiresProof: true,
          proofType: "yes_no"
        }
      ]
    },
    {
      id: "hierarchy",
      title: "Visual Hierarchy 101",
      description: "A deep dive into ocular movement and how to guide users through complex interfaces using scale, color, and contrast.",
      category: "Composition",
      level: "Intermediate",
      tutor: {
        name: "Mike",
        avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBrYyu61jjvwsIyQTvxJpNRuc27Q5SVlCsTcvx07R5JkBbUFDgxSlBNZKWs1SjhZLyWBCvA66HGifRQShhg6aJOjNN-IyszPDPQSxBJxCk9pqoZNXEwCpkO-nRTQjKE_BsazwXp-usiGDc4KHMB9hvx8bBUmM6yi90LeWaG3SbiEiFdbGS_pSCZyfji7iXjuDAn5v2x2lNKlQg_eK0WENZN4DNwbdPKXEAxUVd-jEhHZm02bG2FJN3MqcHmnQ-9kZr6qLmhWPChp_rK"
      },
      tasks: [
        {
          id: "h1",
          description: "Analyze 3 websites for visual hierarchy",
          requiresProof: true,
          proofType: "link"
        }
      ]
    },
    {
      id: "glass",
      title: "Liquid Glass Aesthetics",
      description: "Harness the power of modern CSS to create premium glassmorphic interfaces with depth, blur, and vibrant gradients.",
      category: "Advanced",
      level: "Expert",
      tutor: {
        name: "Alex",
        avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDKWQEhOB5oVlcDLjgHgZi9fZNxm6GmbsJoHmlULq5J9eQZOuzfiHg0D4sn7duCfetxUTKBb8qQM4iixpzbwWTcyfZx9P4D5C8gb-IzgF25iJWsc-FN50riXnDZ3kPLH45rEbKBkjhZhqX2Y6zVYouQOYY_HOTytsHwwHXWWR3Rjn1k4yOkgvHPVlHBfYRwLuvUfPDKHUyB5O0BNa_MGutCZqEtoKVf0h1D6FzPE1qaYZkf7KGRKKrlz03Ar2k1QvMK6oMIpZBNfXmS"
      },
      tasks: [
        {
          id: "g1",
          description: "Recreate the Blink Quest card in CSS",
          requiresProof: true,
          proofType: "link"
        }
      ]
    },
    {
      id: "micro",
      title: "Micro-Interactions",
      description: "Discover how small details can make or break a user experience through feedback loops and delightful motion.",
      category: "Interaction",
      level: "Intermediate",
      tutor: {
        name: "Jessica",
        avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuD9wNtloBz1jznG__snB6zdgkdEy-eKNOHkKrgBar4tYzi8OWncCcOVxTqNt9YuLFrZvRcGAQUrus2kRKrIbKSlm6ISMAk0w1F0InZfPJjQsLrnq1dyTHKNeZFVb780qb1zV_J3-QEMLOPP2X4F6UOtVMcmXnysxiYDDrfJKnueg0R85-T4b2_BwfE-JmnYyDIxkkWsYOwrqCL41WP_uV8_Gz8R15AW4oQWjBivYD_ghFqisc__tLuyJoDph_qZdhMQ0sKkifG--EJj"
      },
      tasks: [
        {
          id: "mi1",
          description: "Design a button with 3 states",
          requiresProof: true,
          proofType: "link"
        }
      ]
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