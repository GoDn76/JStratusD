"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Layers3, Loader2, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('jstratusd-token');
    if (!token) {
      router.replace('/login');
    } else {
      setIsVerified(true);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('jstratusd-token');
    localStorage.removeItem('jstratusd-userId');
    router.push('/login');
  };

  if (!isVerified) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    // Outer Wrapper: Set the dark background for the whole page (assuming bg-background is dark)
    <div className="min-h-screen w-full bg-background">
      
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        
        {/* Header Content: Use container, mx-auto, and padding for centering */}
        <div className="container mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Layers3 className="h-6 w-6 text-primary" />
            <span className="font-bold">JStratusD</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>
      
      {/* Main Content Area */}
      {/* Centering Fix: Ensure the main content uses container, mx-auto, and appropriate padding */}
      <main className="container mx-auto max-w-screen-2xl py-8 px-4">
        {children}
      </main>
    </div>
  );
}