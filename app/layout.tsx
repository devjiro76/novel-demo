import type { Metadata, Viewport } from 'next';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'Interactive Novel',
  description: 'AI-driven interactive novel with emotion engine',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
