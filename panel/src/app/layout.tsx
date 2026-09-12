import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FZ KeyAuth',
  description: 'FZ KeyAuth — authentication & licensing panel',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link
          href="https://cdn.jsdelivr.net/npm/remixicon@4.1.0/fonts/remixicon.css"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
