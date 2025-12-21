"use client";

import React, { useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Deployment } from '@/lib/types'; 
import api from '@/lib/api';

// Extract the status type for cleaner code
type DeploymentStatus = Deployment['status'];

// FIX 1: Update interface to match Backend response (use 'content', not 'message')
interface LogEntry {
  id: number;
  deploymentId: string;
  timestamp: string;
  content: string; // <--- Changed from 'message' to 'content'
}

interface TerminalProps {
  deploymentId: string;
  deploymentStatus: DeploymentStatus;
}

async function fetchLogs(deploymentId: string): Promise<LogEntry[]> {
  const { data } = await api.get(`/jsd/deploys/${deploymentId}/logs`);
  return data || []; 
}

export function Terminal({ deploymentId, deploymentStatus }: TerminalProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Polling Condition: Only poll if building
  const shouldPoll = deploymentStatus === 'BUILDING';

  // Fetch Condition: Fetch for anything except QUEUED
  const shouldFetch = deploymentStatus !== 'QUEUED';

  const { data: logs, isLoading, isError, error } = useQuery<LogEntry[], Error>({
    queryKey: ['logs', deploymentId],
    queryFn: () => fetchLogs(deploymentId),
    refetchInterval: shouldPoll ? 2000 : false,
    enabled: shouldFetch, 
  });
  
  // Auto-scroll logic
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [logs]);

  const dotColor = (status: DeploymentStatus) => {
    switch (status) {
      case 'QUEUED': return 'bg-yellow-400';
      case 'BUILDING': return 'bg-sky-400 animate-pulse';
      case 'READY': return 'bg-green-400';
      case 'FAILED':
      case 'TIMED_OUT': return 'bg-red-400';
      case 'CANCELLED': return 'bg-slate-400';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="rounded-lg border border-border bg-gray-950/70 shadow-lg">
      <div className="flex items-center justify-between border-b border-border/70 p-3">
        <h3 className="text-sm font-medium text-white/80">Live Logs</h3>
        <div className="flex items-center gap-2">
          {shouldPoll && isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
          )}
          <span 
            className={`h-2 w-2 rounded-full ${dotColor(deploymentStatus)}`} 
            title={`Status: ${deploymentStatus}`} 
          />
        </div>
      </div>

      <ScrollArea 
        className="h-96 w-full p-4 font-mono text-xs text-white"
        ref={scrollAreaRef as any}
      >
        {isError && (
          <p className="text-red-400">Error loading logs: {error.message}</p>
        )}
        
        {!shouldFetch && (
           <div className="flex flex-col items-center justify-center h-full text-gray-500">
             <Loader2 className="h-6 w-6 animate-spin mb-2 opacity-50" />
             <p>Waiting for build to start...</p>
           </div>
        )}

        {/* Display Logs */}
        {logs?.map((log, index) => (
          <p key={index} className="whitespace-pre-wrap leading-relaxed">
            {/* Safe check for timestamp slice */}
            <span className="text-gray-500 mr-2">
                {log.timestamp ? log.timestamp.substring(11, 19) : '--:--:--'}
            </span>
            {/* FIX 2: Render log.content instead of log.message */}
            {log.content}
          </p>
        ))}
        
        {shouldFetch && logs?.length === 0 && !isLoading && (
            <p className="text-gray-500 italic">No logs available for this deployment.</p>
        )}
      </ScrollArea>
      
      {!shouldPoll && shouldFetch && (
          <div className="p-2 border-t border-border/70 text-center text-xs text-gray-500">
              Process {deploymentStatus}. Log stream ended.
          </div>
      )}
    </div>
  );
}