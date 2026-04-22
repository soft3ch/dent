'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface PWAContextType {
  canInstall: boolean;
  install: () => Promise<void>;
}

const PWAContext = createContext<PWAContextType>({
  canInstall: false,
  install: async () => {},
});

export const usePWA = () => useContext(PWAContext);

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Register Service Worker only for dashboard
    if ('serviceWorker' in navigator) {
      // Registering with /dashboard scope if possible, 
      // but serving from root /sw.js is easier for Next.js
      navigator.serviceWorker
        .register('/sw.js', { scope: '/dashboard' })
        .then((registration) => {
          console.log('SW registered for /dashboard:', registration.scope);
        })
        .catch((error) => {
          console.error('SW registration failed:', error);
        });
    }

    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // We've used the prompt, and can't use it again, so clear it
    setDeferredPrompt(null);
    setCanInstall(false);
  };

  return (
    <PWAContext.Provider value={{ canInstall, install }}>
      {children}
    </PWAContext.Provider>
  );
}
