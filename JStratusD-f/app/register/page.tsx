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
import { Layers3, Loader2, ShieldCheck, ArrowRight, User, Mail, Lock } from 'lucide-react';
import api from '@/lib/api';

// --- SCHEMA 1: Registration with Confirm Password ---
const registerSchema = z.object({
  name: z.string().min(3, { message: "Username must be at least 3 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string().min(1, { message: "Please confirm your password." }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// --- SCHEMA 2: OTP Verification ---
const otpSchema = z.object({
  otp: z.string().length(6, { message: "OTP must be exactly 6 digits." }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Flow State
  const [step, setStep] = useState<'REGISTER' | 'VERIFY'>('REGISTER');
  
  // Store credentials for auto-login
  const [tempCredentials, setTempCredentials] = useState({ email: "", password: "" });

  // --- FORMS ---
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  // --- HELPER: CENTRALIZED ERROR HANDLER ---
  const handleError = (error: any, fallbackMessage: string) => {
    console.error("Auth Debug:", error);

    // 1. Connection / Network Error
    if (!error.response) {
      toast.error("Connection failed. Please check your internet or try again later.");
      return;
    }

    const serverData = error.response.data;

    // 2. Service Down
    if (serverData?.error) {
      toast.error(`Service Error: ${serverData.error}`);
      return;
    }

    // 3. Logic/Validation Error
    if (serverData?.message) {
      toast.error(serverData.message);
      return;
    }

    // 4. Generic Fallback
    toast.error(fallbackMessage);
  };

  // --- STEP 1 HANDLER: REGISTER ---
  const onRegisterSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      // Clean payload: Remove confirmPassword before sending to API
      const { confirmPassword, ...payload } = data;

      await api.post('/auth/register', payload);
      
      // Save credentials for Step 2
      setTempCredentials({ email: data.email, password: data.password });
      setStep('VERIFY');
      toast.success("Account created! Please check your email for the OTP.");
      
    } catch (error: any) {
      handleError(error, "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- STEP 2 HANDLER: VERIFY & AUTO-LOGIN ---
  const onVerifySubmit = async (data: OtpFormValues) => {
    setIsLoading(true);
    try {
      // A. Verify Email
      const verifyPayload = {
        email: tempCredentials.email,
        otp: data.otp
      };
      await api.post('/auth/verify-email', verifyPayload);
      toast.success("Email verified! Logging you in...");

      // B. Auto-Login
      const loginPayload = {
        email: tempCredentials.email,
        password: tempCredentials.password
      };
      
      const loginResponse = await api.post('/auth/login', loginPayload);
      
      const token = loginResponse.data?.accessToken || loginResponse.data?.token;
      
      if (token) {
        const cleanToken = token.replace(/"/g, ''); 
        localStorage.setItem('jstratusd-token', cleanToken);
        router.push('/dashboard');
      } else {
        throw new Error("No access token found in login response");
      }

    } catch (error: any) {
      // Special Handling: If verification passed but login failed
      if (error.config?.url?.includes('/auth/login') || error.message.includes("No access token")) {
         toast.error("Verification successful, but auto-login failed. Please log in manually.");
         router.push('/login');
      } else {
         // Use standard error handler for Verification failures
         handleError(error, "Invalid OTP or verification failed.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-grid-small-white/[0.2] p-4">
      <Card className="w-full max-w-md bg-background/80 backdrop-blur-sm">
        
        {/* --- STEP 1: REGISTRATION UI --- */}
        {step === 'REGISTER' && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Layers3 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Create an Account</CardTitle>
              <CardDescription>Join JStratusD and start deploying.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="yourusername" className="pl-9" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
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
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
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
                  
                  {/* ADDED CONFIRM PASSWORD FIELD */}
                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
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

                  <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign Up"}
                  </Button>
                </form>
              </Form>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </>
        )}

        {/* --- STEP 2: VERIFICATION UI --- */}
        {step === 'VERIFY' && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                <ShieldCheck className="h-6 w-6 text-green-500" />
              </div>
              <CardTitle className="text-2xl">Verify your Email</CardTitle>
              <CardDescription>
                Enter the code sent to <span className="font-medium text-foreground">{tempCredentials.email}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...otpForm}>
                <form onSubmit={otpForm.handleSubmit(onVerifySubmit)} className="space-y-6">
                  <FormField
                    control={otpForm.control}
                    name="otp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="sr-only">OTP Code</FormLabel>
                        <FormControl>
                          <div className="flex justify-center">
                            <Input 
                              placeholder="123456" 
                              className="text-center text-2xl tracking-[0.5em] font-mono h-14 w-full" 
                              maxLength={6}
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-center" />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <>Verify & Auto-Login <ArrowRight className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                </form>
              </Form>

              <div className="mt-6 text-center">
                <Button 
                  variant="link" 
                  className="text-sm text-muted-foreground"
                  onClick={() => setStep('REGISTER')}
                  disabled={isLoading}
                >
                  Change Email / Go Back
                </Button>
              </div>
            </CardContent>
          </>
        )}

      </Card>
    </div>
  );
}