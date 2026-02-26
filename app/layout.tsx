import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '못참아 — Interactive Novel',
  description: 'AI-driven interactive novel with emotion engine',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
