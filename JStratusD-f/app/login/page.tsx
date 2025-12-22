"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LayoutDashboard, Loader2, Lock, Mail, ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';

// --- SCHEMAS ---

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// Updated Schema with Confirm Password validation
const resetPasswordSchema = z.object({
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

// --- COMPONENT ---

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // VIEW STATES: 'LOGIN' | 'FORGOT' | 'RESET'
  const [view, setView] = useState<'LOGIN' | 'FORGOT' | 'RESET'>('LOGIN');
  
  // Store email to pass between steps
  const [resetEmail, setResetEmail] = useState("");

  // --- FORMS ---
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const forgotForm = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const resetForm = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { otp: "", newPassword: "", confirmPassword: "" },
  });

  // --- HELPER: ERROR HANDLER ---
  const handleApiError = (error: any, fallback: string) => {
    console.error("Auth Error:", error);
    if (!error.response) {
      toast.error("Connection failed. Server might be down.");
      return;
    }
    const data = error.response.data;
    if (data?.error) {
      toast.error(data.error); 
    } else if (data?.message) {
      toast.error(data.message); 
    } else {
      toast.error(fallback);
    }
  };

  // --- HANDLER: LOGIN ---
  const onLoginSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', data);
      const token = response.data?.accessToken || response.data?.token || response.data?.jwt;

      if (token) {
        localStorage.setItem('jstratusd-token', token.replace(/"/g, ''));
        localStorage.removeItem('jstratusd-userId');
        toast.success("Welcome back!");
        router.push('/dashboard');
      } else {
        throw new Error("No token received");
      }
    } catch (error: any) {
      handleApiError(error, "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- HANDLER: REQUEST RESET (Step 1) ---
  const onRequestResetSubmit = async (data: ForgotPasswordValues) => {
    setIsLoading(true);
    try {
      await api.post('/auth/request-password-reset', data);
      setResetEmail(data.email); 
      setView('RESET');
      toast.success("OTP sent! Please check your email.");
    } catch (error: any) {
      handleApiError(error, "Failed to send reset email.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- HANDLER: CONFIRM RESET (Step 2) ---
  const onResetConfirmSubmit = async (data: ResetPasswordValues) => {
    setIsLoading(true);
    try {
      const payload = {
        email: resetEmail,
        otp: data.otp,
        newPassword: data.newPassword 
        // We do NOT send confirmPassword to the API
      };

      await api.post('/auth/reset-password', payload);
      
      toast.success("Password reset successful! Please login.");
      
      loginForm.setValue('email', resetEmail);
      setView('LOGIN');
      
    } catch (error: any) {
      handleApiError(error, "Failed to reset password. Invalid OTP?");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-grid-small-white/[0.2] p-4">
      <Card className="w-full max-w-md bg-background/80 backdrop-blur-sm transition-all duration-300">
        
        {/* ================= VIEW 1: LOGIN ================= */}
        {view === 'LOGIN' && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <LayoutDashboard className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="name@example.com" className="pl-9" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                            <FormLabel>Password</FormLabel>
                            <Button 
                                variant="link" 
                                className="px-0 font-normal h-auto text-xs text-muted-foreground hover:text-primary"
                                onClick={() => setView('FORGOT')}
                                type="button"
                            >
                                Forgot password?
                            </Button>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="password" placeholder="••••••••" className="pl-9" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In"}
                  </Button>
                </form>
              </Form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="font-medium text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </CardContent>
          </>
        )}

        {/* ================= VIEW 2: FORGOT PASSWORD ================= */}
        {view === 'FORGOT' && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                <KeyRound className="h-6 w-6 text-blue-500" />
              </div>
              <CardTitle className="text-xl">Reset Password</CardTitle>
              <CardDescription>Enter your email to receive a reset code.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...forgotForm}>
                <form onSubmit={forgotForm.handleSubmit(onRequestResetSubmit)} className="space-y-4">
                  <FormField
                    control={forgotForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="name@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send OTP"}
                  </Button>
                </form>
              </Form>
              <Button 
                variant="ghost" 
                className="w-full mt-4" 
                onClick={() => setView('LOGIN')}
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
              </Button>
            </CardContent>
          </>
        )}

        {/* ================= VIEW 3: RESET PASSWORD ================= */}
        {view === 'RESET' && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                <ShieldCheck className="h-6 w-6 text-green-500" />
              </div>
              <CardTitle className="text-xl">Set New Password</CardTitle>
              <CardDescription>
                Enter the code sent to <span className="font-medium text-foreground">{resetEmail}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...resetForm}>
                <form onSubmit={resetForm.handleSubmit(onResetConfirmSubmit)} className="space-y-4">
                  
                  <FormField
                    control={resetForm.control}
                    name="otp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>OTP Code</FormLabel>
                        <FormControl>
                           <Input 
                              placeholder="123456" 
                              className="text-center tracking-widest font-mono text-lg" 
                              maxLength={6}
                              {...field} 
                           />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={resetForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                           <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="password" placeholder="New strong password" className="pl-9" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* ADDED CONFIRM PASSWORD FIELD */}
                  <FormField
                    control={resetForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                           <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="password" placeholder="Confirm password" className="pl-9" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Reset Password"}
                  </Button>
                </form>
              </Form>
              
              <Button 
                variant="ghost" 
                className="w-full mt-4" 
                onClick={() => setView('FORGOT')}
                disabled={isLoading}
              >
                Change Email
              </Button>
            </CardContent>
          </>
        )}

      </Card>
    </div>
  );
}