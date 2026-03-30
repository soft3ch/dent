import type { Metadata } from 'next';
import { Inter, Manrope } from 'next/font/google';
import './globals.css';
import QueryProvider from '@/components/providers/QueryProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700']
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  weight: ['400', '600', '700', '800']
});

export const metadata: Metadata = {
  title: 'Dra. Flavia Gisela Toledo',
  description: 'Gestión Odontológica Integral',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${manrope.variable} light`}>
      <body className="bg-surface text-on-surface antialiased font-body selection:bg-primary-container selection:text-on-primary-container">
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
