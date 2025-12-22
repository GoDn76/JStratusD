// app/page.tsx

'use client'; // The entire page must be a client component to check localStorage

import Link from 'next/link';
import { Layers3, Rocket, Zap, Clock, Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Define the purpose of the application's main features
const features = [
  {
    icon: Rocket,
    title: "Instant Deployments",
    description: "Launch your applications immediately upon code push. Focus solely on development, not infrastructure.",
  },
  {
    icon: Zap,
    title: "Real-time Monitoring",
    description: "View live build logs and deployment status directly in the console, ensuring full visibility.",
  },
  {
    icon: Clock,
    title: "Fast Rebuilds",
    description: "Experience rapid rebuilds and deployments, minimizing downtime and maximizing productivity.",
  },
  {
    icon: Shield,
    title: "Secure Infrastructure",
    description: "Benefit from a robust, secure, and scalable backend managed entirely for you.",
  },
];

// This is the main Client Component for the root path (/)
export default function LandingPage() {
  const router = useRouter();

  // FIX: Client-side check and redirect using localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('jstratusd-token');
      if (token && token !== 'undefined') {
        router.replace('/dashboard');
      }
    }
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      
      {/* Header/Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 max-w-screen-xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Layers3 className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">JStratusD</span>
          </Link>
          <nav>
            <Button asChild>
              <Link href="/login">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        
        {/* 1. Hero Section */}
        <section className="py-20 sm:py-28 lg:py-36 text-center bg-muted/20">
          <div className="container mx-auto max-w-4xl px-4">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
              Automated Deployments. <span className="text-primary">Zero Hassle.</span>
            </h1>
            <p className="text-lg sm:text-xl text-textSecondary mb-10 max-w-3xl mx-auto">
              JStratusD is your seamless platform for fast rebuild and rapid application deployment. Connect your repository and go live in seconds.
            </p>
            <div className="flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/register">
                  Start Deploying Today <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <Link href="/login">
                  Log In
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* 2. Features Section */}
        <section className="py-20 lg:py-28">
          <div className="container mx-auto max-w-screen-xl px-4">
            <h2 className="text-4xl font-bold tracking-tight text-center mb-12">
              Built for Modern Development
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="flex flex-col text-center p-4 h-full">
                  <CardHeader>
                    <feature.icon className="h-10 w-10 text-primary mx-auto mb-4" />
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-textSecondary">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 bg-background/95">
        <div className="container mx-auto max-w-screen-xl px-4 text-center text-sm text-textSecondary">
          &copy; {new Date().getFullYear()} JStratusD. All rights reserved.
        </div>
      </footer>
    </div>
  );
}