import { Metadata, Viewport } from 'next';
import RootLayout from '@/app/root-layout';
import { GeistSans } from 'geist/font/sans';
import { Analytics } from '@vercel/analytics/react';
import Footer from '@/app/components/Footer';

export const metadata: Metadata = {
  metadataBase: new URL('https://solanatokenfactory.com'),
  title: {
    default: 'Solana Token Factory - Create SPL Tokens Easily',
    template: '%s | Solana Token Factory'
  },
  description: 'Create and manage Solana SPL tokens with ease. Mint new tokens, manage authorities, and customize your token settings all in one place.',
  keywords: [
    'Solana',
    'SPL Token',
    'Token Creation',
    'Crypto Token',
    'Blockchain',
    'Web3',
    'Token Factory',
    'Mint Token',
    'DeFi',
    'Cryptocurrency'
  ],
  authors: [{ name: 'Solana Token Factory' }],
  creator: 'Solana Token Factory',
  publisher: 'Solana Token Factory',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },  // Simplified this
    ],
    shortcut: '/favicon.ico',   // Added this
    apple: '/apple-touch-icon.png',  // Simplified this
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://solanatokenfactory.com',
    siteName: 'Solana Token Factory',
    title: 'Create Solana SPL Tokens Easily',
    description: 'The easiest way to create and manage Solana SPL tokens. No coding required.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Solana Token Factory',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Solana Token Factory - Create SPL Tokens Easily',
    description: 'Create and manage Solana SPL tokens with ease. No coding required.',
    images: ['/twitter-image.png'],
    creator: '@SolanaTokenFactory',
  },
  alternates: {
    canonical: 'https://solanatokenfactory.com',
    languages: {
      'en-US': 'https://solanatokenfactory.com',
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0B0B1E' },
  ],
  colorScheme: 'dark',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html 
      lang="en" 
      suppressHydrationWarning 
      className={`${GeistSans.variable} antialiased`}
    >
      <head>
        <link 
          rel="preconnect" 
          href={process.env.NEXT_PUBLIC_RPC_ENDPOINT} 
          crossOrigin="anonymous" 
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body 
        suppressHydrationWarning
        className="min-h-screen bg-[#0B0B1E] text-white selection:bg-[#9945FF]/30"
      >
        <RootLayout>
          {children}
        </RootLayout>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
