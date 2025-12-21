"use client";

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  AlertCircle, 
  ArrowLeft, 
  ExternalLink, 
  GitBranch, 
  RefreshCw, 
  Loader2, 
  Ban, 
  Trash2,
  AlertTriangle 
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"; 
import api from '@/lib/api';
import { Deployment } from '@/lib/types'; 
import { StatusBadge } from '@/components/status-badge';
import { Terminal } from '@/components/terminal';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Suspense, useEffect, useState } from 'react';
import { toast } from 'sonner';

const BASE_DOMAIN = 'jstratusd.duckdns.org';
const BASE_URL = `https://${BASE_DOMAIN}`;

async function fetchDeployment(id: string, token: string): Promise<Deployment> {
  try {
    const cleanToken = token.replace(/"/g, '').trim();
    const { data } = await api.get(`/jsd/deploys/${id}`, {
      headers: { Authorization: `Bearer ${cleanToken}` }
    });
    if (!data || typeof data !== 'object') throw new Error();
    return data;
  } catch (error) {
    console.error("Fetch Project Debug:", error); // Log real error
    throw new Error("Generic Error"); // Hide details
  }
}

const getPublicUrl = (deploymentId: string) => {
    return `${BASE_URL}/${deploymentId}`;
}

function ProjectDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  
  const id = searchParams.get('id');
  const [token, setToken] = useState<string | null>(null);
  
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  useEffect(() => {
    const storedToken = localStorage.getItem('jstratusd-token');
    if (!storedToken || storedToken === 'undefined') {
      router.replace('/login');
      return;
    }
    setToken(storedToken);
  }, [router]);

  const { data: deployment, isLoading, isError, refetch } = useQuery<Deployment, Error>({
    queryKey: ['deployment', id, token],
    queryFn: () => fetchDeployment(id!, token!), 
    enabled: !!id && !!token && token !== 'undefined',
    retry: 1
  });

  // HANDLERS (Same as before, hidden for brevity as they are unchanged)
  const handleRebuild = async () => { 
    if (!id) return;
    setIsRebuilding(true);
    try {
        await api.post(`/jsd/deploys/${id}/rebuild`);
        toast.success("Rebuild triggered!");
        queryClient.invalidateQueries({ queryKey: ['deployment', id] });
        queryClient.invalidateQueries({ queryKey: ['logs', id] });
    } catch { toast.error("Something went wrong"); } 
    finally { setIsRebuilding(false); }
  };

  const handleCancel = async () => { 
    if (!id) return;
    setIsCancelling(true);
    try {
        await api.post(`/jsd/deploys/${id}/cancel`);
        toast.success("Deployment cancelled.");
        queryClient.invalidateQueries({ queryKey: ['deployment', id] });
    } catch { toast.error("Something went wrong"); } 
    finally { setIsCancelling(false); }
  };

  const handleConfirmDelete = async () => { 
    if (!id) return;
    setIsDeleting(true);
    try {
        await api.delete(`/jsd/deploys/${id}`);
        toast.success("Project deleted.");
        setIsDeleteDialogOpen(false); 
        router.push('/dashboard');
    } catch { toast.error("Something went wrong"); setIsDeleting(false); }
  };

  const getRepoName = (url: string | null | undefined): string => {
    if (!url) return 'Unnamed Project';
    try {
      const name = new URL(url).pathname.substring(1).replace('.git', '');
      return name.split('/').pop() || 'Unnamed Project';
    } catch {
      return url.split('/').pop() || 'Unnamed Project';
    }
  };
  
  const getRepoPath = (url: string | null | undefined): string => {
    if (!url) return 'N/A';
    try {
      return new URL(url).pathname.substring(1).replace('.git', '');
    } catch {
      return url || 'N/A';
    }
  };

  // --- UI RENDERING ---

  if (!id) return <div className="p-8 text-center text-textSecondary"><p>Invalid Project ID</p></div>;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-1/4" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-6 w-3/4" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // GENERIC ERROR UI
  if (isError) {
    return (
      <div className="space-y-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>
                We encountered an issue while loading this project. Please try again later.
                <div className="mt-4">
                   <Button variant="outline" size="sm" onClick={() => refetch()}>Reload Page</Button>
                </div>
            </AlertDescription>
          </Alert>
      </div>
    );
  }
  
  if (!deployment) return <div className="p-8 text-center">Project not found.</div>;

  const publicUrl = id ? getPublicUrl(id) : null;
  const isProcessActive = deployment.status === 'QUEUED' || deployment.status === 'BUILDING';
  const displayProjectName = deployment.name || getRepoName(deployment.repositoryUrl);

  return (
    <div className="space-y-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <>
        <div className="border border-border p-6 rounded-lg space-y-6"> 
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{displayProjectName}</h1>
                <StatusBadge status={deployment.status} />
              </div>
              <p className="text-textSecondary flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                {getRepoPath(deployment.repositoryUrl)}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
                {isProcessActive && (
                    <Button variant="destructive" onClick={handleCancel} disabled={isCancelling}>
                        {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ban className="mr-2 h-4 w-4" />}
                        Cancel
                    </Button>
                )}

                {!isProcessActive && (
                    <Button variant="outline" onClick={handleRebuild} disabled={isRebuilding}>
                        {isRebuilding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Rebuild
                    </Button>
                )}

                {!isProcessActive && (
                    <Button 
                        variant="destructive" 
                        size="icon"
                        onClick={() => {
                            setDeleteConfirmation(""); 
                            setIsDeleteDialogOpen(true);
                        }} 
                        disabled={isDeleting}
                        title="Delete Project"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}

                {deployment.status === 'READY' && publicUrl && (
                    <Button asChild>
                        <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                        Visit Site <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                    </Button>
                )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
            <div className="space-y-1">
              <p className="font-medium text-textSecondary">Deployment ID</p>
              <p className="truncate font-mono text-xs">{id}</p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-textSecondary">Branch</p>
              <div className="flex items-center gap-1.5">
                <GitBranch className="h-3.5 w-3.5 text-textSecondary" />
                <p className="font-mono text-xs">{deployment.branch || 'main'}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-textSecondary">Website URL</p>
              <p className="truncate font-mono text-xs">{publicUrl || 'N/A'}</p> 
            </div>
            <div className="space-y-1">
              <p className="font-medium text-textSecondary">Created On</p>
              <p>{deployment.createdAt ? format(new Date(deployment.createdAt), 'MMM d, yyyy') : 'N/A'}</p>
            </div>
          </div>
        </div>
        
        <h2 className="text-2xl font-semibold tracking-tight pt-4">Deployment Logs</h2>
        <Terminal deploymentId={id!} deploymentStatus={deployment.status} />
      </>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
                <AlertTriangle className="h-5 w-5" />
                Delete Project
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the project 
              <span className="font-bold text-foreground"> {displayProjectName} </span>
              and all associated data.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
                <Label htmlFor="confirmation">
                    To confirm, type <span className="font-mono font-bold text-foreground">{displayProjectName}</span> below:
                </Label>
                <Input
                    id="confirmation"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder={displayProjectName}
                    autoComplete="off"
                />
            </div>
          </div>

          <DialogFooter className="sm:justify-between gap-2">
             <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteConfirmation !== displayProjectName || isDeleting}
              className="w-full sm:w-auto"
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ProjectDetailsPage() {
  return (
    <div className="container mx-auto p-6 max-w-screen-xl"> 
      <Suspense fallback={<div className="p-8">Loading project details...</div>}>
        <ProjectDetailsContent />
      </Suspense>
    </div>
  );
}