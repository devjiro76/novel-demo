import type { Metadata, Viewport } from 'next';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppShell } from '@/components/layout';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Novel - Interactive AI Story',
  description: 'AI 기반 인터랙티브 노벨. 캐릭터와 대화하며 스토리를 진행하세요.',
  keywords: ['AI', 'Novel', 'Interactive', 'Chat', 'Character'],
  authors: [{ name: 'Novel Team' }],
  openGraph: {
    title: 'Novel - Interactive AI Story',
    description: 'AI 기반 인터랙티브 노벨. 캐릭터와 대화하며 스토리를 진행하세요.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="dark">
      <body className="antialiased">
        <TooltipProvider delayDuration={100}>
          <AppShell>
            {children}
          </AppShell>
        </TooltipProvider>
        <Toaster 
          position="bottom-center"
          toastOptions={{
            style: {
              background: 'var(--color-surface-2)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--color-text)',
            },
          }}
        />
      </body>
    </html>
  );
}
