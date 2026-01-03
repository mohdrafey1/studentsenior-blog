import type { Metadata } from 'next';
import { Poppins, Lora, Inter } from 'next/font/google';
import Script from 'next/script';
import AdBlockGuard from './components/AdBlockGuard/AdBlockGuard';
import './globals.css';

// ✅ Google Fonts with CSS variable
const poppins = Poppins({
    variable: '--font-poppins',
    subsets: ['latin'],
    weight: ['400', '600', '700'],
});

const lora = Lora({
    variable: '--font-lora',
    subsets: ['latin'],
    weight: ['400'],
});

const inter = Inter({
    variable: '--font-inter',
    subsets: ['latin'],
    weight: ['400', '500'],
});

// ✅ Metadata
export const metadata: Metadata = {
    title: `Student Senior Blogs${
        process.env.NEXT_PUBLIC_STAGE === 'staging' ? ' [Staging]' : ''
    }`,
    description:
        'Explore tech insights, study tips, and college resources crafted by Student Senior.',
    icons: {
        icon: '/app_icon.png',
    },
    manifest: '/manifest.json',
};

export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    const isProduction = process.env.NODE_ENV === 'production';

    return (
        <html lang='en'>
            <head>
                <meta
                    name='google-site-verification'
                    content='kFmO-Qmw1qGUJOnPkN1PfNbTa3md37yrz08XxYwuE28'
                />
            </head>
            <body
                suppressHydrationWarning
                className={`${poppins.variable} ${lora.variable} ${inter.variable} antialiased`}
            >
                {/* ✅ AdBlockGuard runs on client side only */}
                <AdBlockGuard>{children}</AdBlockGuard>

                {/* ✅ Google Analytics */}
                <Script
                    id='google-analytics-script'
                    async
                    strategy='afterInteractive'
                    src='https://www.googletagmanager.com/gtag/js?id=G-3J80PQMG5T'
                />
                <Script id='google-analytics' strategy='afterInteractive'>
                    {`window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-3J80PQMG5T');`}
                </Script>

                {/* ✅ AdSense only in production */}
                {isProduction && (
                    <Script
                        id='adsense-script'
                        async
                        strategy='afterInteractive'
                        src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4435788387381825'
                        crossOrigin='anonymous'
                    />
                )}
            </body>
        </html>
    );
}
