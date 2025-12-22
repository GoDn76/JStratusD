"use client";

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  PlusCircle, 
  GitBranch, 
  ExternalLink, 
  RefreshCw, 
  Search,
  Rocket,
  AlertTriangle,
  ServerCrash,
  Info, // Import Info Icon
  Construction // Optional icon
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import api from '@/lib/api';
import { Deployment } from '@/lib/types';
import { useState, useEffect } from 'react';

// ... (Fetch function remains the same) ...
async function fetchDeployments(token: string): Promise<Deployment[]> {
  try {
    const cleanToken = token.replace(/"/g, '').trim();
    const response = await api.get('/jsd/deploys', {
      headers: { Authorization: `Bearer ${cleanToken}` }
    });
    if (!Array.isArray(response.data)) return []; 
    return response.data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error("Fetch Debug:", err); 
    throw new Error("Generic Error"); 
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('jstratusd-token');
    if (!storedToken || storedToken === 'undefined') {
      router.replace('/login');
      return;
    }
    setToken(storedToken);
  }, [router]);

  const { data: deployments, isLoading, isError, refetch } = useQuery({
    queryKey: ['deployments', token],
    queryFn: () => fetchDeployments(token!),
    enabled: !!token,
    refetchOnWindowFocus: true, 
    retry: 1, 
  });

  // ... (Other handlers remain the same) ...

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } catch {
      // Handled by useEffect
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // ... (Helpers remain the same) ...
  const getRepoNameFallback = (url: string | null | undefined): string => {
    if (!url) return 'Unnamed Project';
    try {
      const name = new URL(url).pathname.substring(1).replace('.git', '');
      return name.split('/').pop() || 'Unnamed Project';
    } catch {
      return url.split('/').pop() || 'Unnamed Project';
    }
  };
  const getRepoPath = (url: string | null | undefined) => { /* ... */ return url || 'N/A'; };
  const filteredDeployments = deployments?.filter((d) => 
    (d.name && d.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (d.repositoryUrl && d.repositoryUrl.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  if (!token) return null; 

  return (
    <div className="space-y-8 container mx-auto p-6 max-w-screen-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-textSecondary">Manage your projects and deployments.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading || isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => router.push('/new')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* --- FEATURE WARNING ALERT --- */}
      <Alert className="bg-blue-500/10 border-blue-500/20 text-blue-500">
        <Construction className="h-4 w-4" />
        <AlertTitle>Notice: Server Builds</AlertTitle>
        <AlertDescription>
          Server-side build infrastructure is currently not supported but is planned for a future update. 
          Please ensure your projects are pre-built or static for now.
        </AlertDescription>
      </Alert>

      {/* --- ERROR STATE --- */}
      {isError && (
        <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2 border-destructive/50 bg-destructive/5 text-destructive">
          <ServerCrash className="h-4 w-4" />
          <AlertTitle>Connection Issue</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>Something went wrong while loading your projects.</p>
            <Button variant="outline" size="sm" className="w-fit border-destructive/30 hover:bg-destructive/10" onClick={() => refetch()}>
                Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* --- SEARCH --- */}
      {!isError && (deployments?.length || 0) > 0 && (
        <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-textSecondary" />
            <Input
                placeholder="Search projects..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            </div>
        </div>
      )}

      {/* --- LOADING --- */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[250px] w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* --- EMPTY STATE --- */}
      {!isLoading && !isError && deployments?.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-surface/50 py-24 text-center">
          <Rocket className="mx-auto h-12 w-12 text-textSecondary" />
          <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
          <p className="mt-1 text-sm text-textSecondary">Get started by creating your first project.</p>
          <Button asChild className="mt-6">
            <Link href="/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Project
            </Link>
          </Button>
        </div>
      )}

      {/* --- DATA GRID --- */}
      {!isLoading && !isError && filteredDeployments.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredDeployments.map((deployment) => (
            <Link href={`/project?id=${deployment.id}`} key={deployment.id} className="block group h-full">
              <Card className="h-full flex flex-col justify-between transition-all hover:border-primary/50 hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                      <StatusBadge status={deployment.status} />
                  </div>
                  <CardTitle className="truncate text-lg font-bold leading-tight">
                    {deployment.name || getRepoNameFallback(deployment.repositoryUrl)}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1 text-xs truncate mt-1">
                      <GitBranch className="h-3 w-3 flex-shrink-0" />
                      {getRepoPath(deployment.repositoryUrl)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pb-3">
                    <div className="flex flex-wrap gap-2 mt-2">
                        <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium ring-1 ring-inset ring-gray-500/10">
                            <GitBranch className="mr-1 h-3 w-3 opacity-70" />
                            {deployment.branch || 'main'}
                        </span>
                    </div>
                </CardContent>
                <CardFooter className="pt-3 border-t border-border/40 bg-muted/20">
                  <div className="w-full flex justify-between items-center text-xs text-textSecondary">
                      <span>
                          {deployment.updatedAt 
                          ? formatDistanceToNow(new Date(deployment.updatedAt), { addSuffix: true })
                          : 'Just now'}
                      </span>
                      {deployment.status === 'READY' && (
                          <span className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                              Open <ExternalLink className="h-3 w-3" />
                          </span>
                      )}
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}