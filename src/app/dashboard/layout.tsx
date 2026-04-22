import type { Metadata, Viewport } from 'next';
import { PWAProvider } from '@/components/dentist/PWAProvider';

export const viewport: Viewport = {
  themeColor: '#004ac6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Serenity Dental',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PWAProvider>
      {children}
    </PWAProvider>
  );
}
