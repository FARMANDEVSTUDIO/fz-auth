import type { Metadata } from 'next';
import { Barlow, Rajdhani, Share_Tech_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import ThemeProvider from '@/components/ThemeProvider';
import LanguageProvider from '@/components/LanguageProvider';
import { isRtlLocale } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n/server';
import AnimatedBackground from '@/components/AnimatedBackground';
import CustomCursor from '@/components/CustomCursor';
import SplashScreen from '@/components/SplashScreen';
import FloatingShapes from '@/components/FloatingShapes';
import './globals.css';

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-body',
  display: 'swap',
});

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-heading',
  display: 'swap',
});

const shareTechMono = Share_Tech_Mono({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'FZ AUTH',
    template: '%s | FZ AUTH',
  },
  description: 'FZ AUTH — authentication & licensing platform. Secure your applications with ease. Developed by FZ.',
  keywords: ['authentication', 'licensing', 'auth platform', 'FZ AUTH', 'API keys', 'user management', 'license management'],
  authors: [{ name: 'FZ' }],
  openGraph: {
    title: 'FZ AUTH',
    description: 'Authentication & licensing platform. Secure your applications with ease.',
    siteName: 'FZ AUTH',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FZ AUTH',
    description: 'Authentication & licensing platform. Secure your applications with ease.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  manifest: '/manifest.json',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();

  // `dir` deliberately stays "ltr" for every language. Urdu and Arabic get
  // their direction on the text itself, so the dashboard shell keeps the
  // exact layout English has. `data-locale-dir` is what the CSS hooks onto.
  return (
    <html
      lang={locale}
      dir="ltr"
      data-locale-dir={isRtlLocale(locale) ? 'rtl' : 'ltr'}
      className={`h-full ${barlow.variable} ${rajdhani.variable} ${shareTechMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content="#7c3aed" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <script dangerouslySetInnerHTML={{ __html: `
          try{var t=localStorage.getItem('fz-theme');if(t==='warm'||t==='light')document.documentElement.classList.add(t)}catch(e){}
        ` }} />
        <script dangerouslySetInnerHTML={{ __html: `
          if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});})}
        ` }} />
      </head>
      <body className="min-h-full antialiased font-sans" suppressHydrationWarning>
        <SplashScreen />
        <CustomCursor />
        <AnimatedBackground />
        <FloatingShapes />
        <ThemeProvider>
          <LanguageProvider initialLocale={locale}>
            {children}
          </LanguageProvider>
        </ThemeProvider>
        <div suppressHydrationWarning>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--color-card-solid)',
                border: '1px solid var(--color-edge-solid)',
                color: 'var(--color-text)',
              },
            }}
          />
        </div>
      </body>
    </html>
  );
}
