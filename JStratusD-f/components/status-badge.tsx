// components/status-badge.tsx
import { Badge } from "@/components/ui/badge";
// Assuming DeploymentStatus is the union type from your lib/types.ts
// which should now be: 'QUEUED' | 'BUILDING' | 'READY' | 'FAILED' | 'CANCELLED' | 'TIMED_OUT'
import { Deployment } from "@/lib/types"; 
import { cn } from "@/lib/utils";
import React from "react"; // Explicitly import React if needed for JSX

interface StatusBadgeProps {
  status: Deployment['status'];
}

export function StatusBadge({ status }: StatusBadgeProps) {
  
  const statusConfig = {
    QUEUED: {
      label: "Queued",
      // Yellow/Orange for waiting/queued states
      className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      dotClass: "bg-yellow-400",
    },
    BUILDING: {
      label: "Building",
      // Blue for in-progress states
      className: "bg-sky-500/20 text-sky-400 border-sky-500/30",
      dotClass: "bg-sky-400",
    },
    READY: {
      label: "Ready",
      // Green for success states
      className: "bg-green-500/20 text-green-400 border-green-500/30",
      dotClass: "bg-green-400",
    },
    FAILED: {
      label: "Failed",
      // Red for error states
      className: "bg-red-500/20 text-red-400 border-red-500/30",
      dotClass: "bg-red-400",
    },
    // FIX: Added configuration for new statuses using consistent style
    CANCELLED: {
      label: "Cancelled",
      // Gray/Slate for stopped states
      className: "bg-slate-500/20 text-slate-400 border-slate-500/30",
      dotClass: "bg-slate-400",
    },
    TIMED_OUT: {
      label: "Timed Out",
      // Orange/Amber for failure/timeout states
      className: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      dotClass: "bg-orange-400",
    },
  };

  const config = statusConfig[status] || { 
    label: "Unknown", 
    className: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    dotClass: "bg-gray-400"
  };

  // Determine if it should ping (only BUILDING should ping)
  const isBuilding = status === 'BUILDING';

  return (
    // Reverted to your preferred style with variant="outline"
    <Badge variant="outline" className={cn("font-mono text-xs", config.className)}>
      
      {/* Status Dot with Ping Animation (only for BUILDING) */}
      <span className="relative flex h-2 w-2 mr-2">
        {/* Animated Ping - Only visible for BUILDING status */}
        {isBuilding && (
          <span 
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", 
              config.dotClass // Use the dedicated color class for the dot
            )}
          ></span>
        )}
        
        {/* Solid Dot */}
        <span 
          className={cn(
            "relative inline-flex rounded-full h-2 w-2", 
            config.dotClass // Use the dedicated color class for the dot
          )}
        ></span>
      </span>
      
      {config.label}
    </Badge>
  );
}