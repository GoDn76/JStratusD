// lib/types.ts

export interface Deployment {
  id: string;
  name: string;
  status: 'QUEUED' | 'BUILDING' | 'READY' | 'FAILED' | 'CANCELLED' | 'TIMED_OUT'; 
  repositoryUrl: string | null;  // <-- Ensure this is 'string | null'
  websiteUrl: string | null;     // <-- Ensure this is 'string | null'
  createdAt: string;
  updatedAt?: string | null;     // <-- Include null here too
  branch?: string;          // We will display this
  lastCommitHash?: string;  // We will ignore this in the UI
}

export interface LogEntry {
  content: string;
  timestamp: string;
}
