import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Melt Action Vercel - Test App',
  description: 'Test fixture for melt-action-vercel',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
