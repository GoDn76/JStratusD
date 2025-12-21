import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from './providers';
import { Toaster } from "sonner"; // Import Toaster

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "JStratusD",
  description: "Deployment and Project Management Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          {children}
          
          {/* UPDATED TOASTER CONFIGURATION */}
          <Toaster 
            richColors      // Makes Error Red, Success Green, Info Blue
            position="top-center" // Moves it to center (better for mobile/login)
            theme="dark"    // Forces dark mode styling to match your app
            duration={4000} // Keeps it visible for 4 seconds
          /> 
          
        </Providers>
      </body>
    </html>
  );
}