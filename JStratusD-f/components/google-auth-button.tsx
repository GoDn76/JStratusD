'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            ux_mode?: string;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (callback?: (notification: any) => void) => void;
        };
      };
    };
  }
}

type GoogleAuthButtonProps = {
  onSuccess: (credential: string) => Promise<void> | void;
  label?: string;
  className?: string;
};

export default function GoogleAuthButton({
  onSuccess,
  label = 'Continue with Google',
  className = '',
}: GoogleAuthButtonProps) {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const clientId =
    process.env.PUBLIC_GOOGLE_CLIENT_ID ||
    process.env.GOOGLE_CLIENT_ID ||
    '636328991496-maiqkin3mfmq77m9o67v1ges4mmgeij8.apps.googleusercontent.com';

  const handleCredentialResponse = useCallback(
    async (response: { credential?: string }) => {
      if (!response?.credential) {
        toast.error('Google sign-in failed. Please try again.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        await onSuccess(response.credential);
      } catch (error: any) {
        toast.error(error?.message || 'Google sign-in failed.');
      } finally {
        setIsLoading(false);
      }
    },
    [onSuccess]
  );

  useEffect(() => {
    const scriptId = 'google-identity-script';

    const initializeGoogle = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          ux_mode: 'popup',
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        setIsReady(true);
      }
    };

    if (document.getElementById(scriptId)) {
      initializeGoogle();
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    document.body.appendChild(script);

    return () => {
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [clientId, handleCredentialResponse]);

  const handleClick = () => {
    if (!window.google?.accounts?.id) {
      toast.error('Google sign-in is unavailable right now.');
      return;
    }

    if (!isReady) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        ux_mode: 'popup',
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      setIsReady(true);
    }

    window.google.accounts.id.prompt();
  };

  return (
    <Button
      type="button"
      variant="outline"
      className={`w-full justify-center gap-2 border-border/60 bg-background/60 hover:bg-background/90 ${className}`.trim()}
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.5 24c0-1.54-.14-3.02-.4-4.45H24v8.43h12.44c-.54 2.9-2.18 5.36-4.66 7.02l7.23 5.61C43.98 37.14 46.5 31.06 46.5 24z" />
          <path fill="#FBBC05" d="M10.54 19.41L2.56 13.22A23.95 23.95 0 0 0 0 24c0 3.82.92 7.44 2.56 10.78l7.98-6.19c-1.12-3.25-1.12-6.8 0-10.18z" />
          <path fill="#34A853" d="M24 47.5c6.48 0 11.91-2.14 15.88-5.8l-7.23-5.61c-2.01 1.35-4.58 2.15-8.65 2.15-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 47.5 24 47.5z" />
        </svg>
      )}
      {label}
    </Button>
  );
}
