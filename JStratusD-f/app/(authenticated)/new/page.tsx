"use client";

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; // Added Alert imports
import { 
  ArrowLeft, 
  GitBranch, 
  Layout, 
  Loader2, 
  PlusCircle, 
  Trash2, 
  RefreshCw, 
  Info // Added Info icon
} from 'lucide-react';
import api from '@/lib/api';
import { Separator } from '@/components/ui/separator';

const secretSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string().min(1, "Value is required"),
});

const projectSchema = z.object({
  projectName: z.string()
      .min(3, "Project name must be at least 3 characters")
      .max(50, "Project name must be less than 50 characters")
      .regex(/^[a-zA-Z0-9-_]+$/, "Only letters, numbers, dashes, and underscores allowed"),
  repoUrl: z.string().url({ message: "Please enter a valid GitHub repository URL." }),
  branch: z.string().min(1, "Please select a branch to deploy."),
  secrets: z.array(secretSchema).optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export default function NewProjectPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // State for Branch Fetching
  const [branches, setBranches] = useState<string[]>([]);
  const [isFetchingBranches, setIsFetchingBranches] = useState(false);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      projectName: "",
      repoUrl: "",
      branch: "",
      secrets: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "secrets",
  });

  // HELPER: Fetch Branches from Backend
  const handleLoadBranches = async () => {
    const url = form.getValues("repoUrl");
    if (!url) {
      toast.error("Please enter a Repository URL first.");
      return;
    }

    setIsFetchingBranches(true);
    setBranches([]);

    try {
      const response = await api.get('/jsd/deploys/branches', {
        params: { repoUrl: url }
      });

      const rawData = response.data;
      let branchList: string[] = [];

      // FIX: Handle both array of strings and array of objects
      if (Array.isArray(rawData)) {
        if (rawData.length > 0 && typeof rawData[0] === 'object') {
          // If response is [{name: "main", commit: ...}, ...], extract names
          branchList = rawData.map((b: any) => b.name);
        } else {
          // If response is ["main", "dev", ...], use as is
          branchList = rawData;
        }
      }

      if (branchList.length > 0) {
        setBranches(branchList);
        toast.success(`Found ${branchList.length} branches.`);

        // Auto-select 'main' or 'master' if available
        if (branchList.includes('main')) form.setValue('branch', 'main');
        else if (branchList.includes('master')) form.setValue('branch', 'master');
        else form.setValue('branch', branchList[0]);

      } else {
        toast.warning("No branches found or invalid repository.");
      }
    } catch (error: any) {
      console.error("Fetch Branches Error:", error);
      toast.error("Failed to load branches. Check the URL or permissions.");
    } finally {
      setIsFetchingBranches(false);
    }
  };

  const onSubmit = async (data: ProjectFormValues) => {
    setIsLoading(true);
    try {
      const secretsObject = data.secrets?.reduce((acc, secret) => {
        if (secret.key) {
          acc[secret.key] = secret.value;
        }
        return acc;
      }, {} as Record<string, string>);

      const payload = {
        repoUrl: data.repoUrl,
        projectName: data.projectName,
        branch: data.branch,
        secrets: secretsObject || {},
      };

      const response = await api.post('/jsd/deploys', payload);

      const id = response.data?.id || response.data?.deploymentId;

      toast.success("Project created successfully!");

      if (id) {
        router.push(`/project?id=${id}`);
      } else {
        router.push('/dashboard');
      }

    } catch (error: any) {
      console.error("Deploy Error:", error);
      const errorMessage = error.response?.data?.message || "An unexpected error occurred.";
      toast.error(`Failed to create project: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create New Project</CardTitle>
            <CardDescription>Deploy a new project from a GitHub repository.</CardDescription>
          </CardHeader>
          <CardContent>
            
            {/* --- ADDED WARNING ALERT --- */}
            <Alert className="mb-6 bg-blue-500/10 border-blue-500/20 text-blue-500">
                <Info className="h-4 w-4" />
                <AlertTitle>Server Builds Not Yet Supported</AlertTitle>
                <AlertDescription>
                    We are currently working on server-side build infrastructure. 
                    Please note that advanced build commands may not function as expected in this version.
                </AlertDescription>
            </Alert>
            {/* --------------------------- */}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Project Details</h3>

                  <FormField
                      control={form.control}
                      name="projectName"
                      render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Name</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Layout className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-textSecondary" />
                                <Input placeholder="my-awesome-app" className="pl-9" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                      )}
                  />

                  <div className="flex items-end gap-3">
                    <FormField
                        control={form.control}
                        name="repoUrl"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>GitHub Repository URL</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-textSecondary" />
                                  <Input placeholder="https://github.com/user/repo.git" className="pl-9" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleLoadBranches}
                        disabled={isFetchingBranches}
                        className="mb-0.5"
                    >
                      {isFetchingBranches ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      <span className="sr-only sm:not-sr-only sm:ml-2">Load Branches</span>
                    </Button>
                  </div>

                  <FormField
                      control={form.control}
                      name="branch"
                      render={({ field }) => (
                          <FormItem>
                            <FormLabel>Branch</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value}
                                disabled={branches.length === 0}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={branches.length > 0 ? "Select a branch" : "Load repo to select branch"} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {branches.map((b) => (
                                    <SelectItem key={b} value={b}>
                                      {b}
                                    </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                      )}
                  />
                </div>

                <Separator />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium">Environment Variables</h3>
                      <p className="text-sm text-textSecondary">Add secrets that your project needs during build.</p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ key: "", value: "" })}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add
                    </Button>
                  </div>

                  {fields.length === 0 && (
                      <div className="text-sm text-textSecondary italic text-center py-4 border border-dashed rounded-md">
                        No environment variables added.
                      </div>
                  )}

                  <div className="space-y-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                          <FormField
                              control={form.control}
                              name={`secrets.${index}.key`}
                              render={({ field }) => (
                                  <FormItem className="flex-1">
                                    <FormControl>
                                      <Input placeholder="KEY" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                              )}
                          />
                          <FormField
                              control={form.control}
                              name={`secrets.${index}.value`}
                              render={({ field }) => (
                                  <FormItem className="flex-1">
                                    <FormControl>
                                      <Input type="password" placeholder="VALUE" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                              )}
                          />
                          <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => remove(index)}
                              className="mt-[2px]"
                          >
                            <Trash2 className="h-4 w-4 text-destructive hover:text-destructive/80" />
                          </Button>
                        </div>
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Deploy Project"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
  );
}