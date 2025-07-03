import type { Metadata } from 'next';
import { Poppins, Lora } from 'next/font/google';
import Script from 'next/script'; // ✅ Import Script component
import './globals.css';

const poppins = Poppins({
    variable: '--font-poppins',
    subsets: ['latin'],
    weight: ['600'],
});

const lora = Lora({
    variable: '--font-lora',
    subsets: ['latin'],
    weight: ['400'],
});

export const metadata: Metadata = {
    title: `SS Blogs${
        process.env.NODE_ENV !== 'production' ? ` [Staging]` : ''
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
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang='en'>
            <head>
               <meta name="google-site-verification" content="kFmO-Qmw1qGUJOnPkN1PfNbTa3md37yrz08XxYwuE28" />
                <Script
                    id='adsense-script'
                    async
                    strategy='afterInteractive'
                    src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4435788387381825'
                    crossOrigin='anonymous'
                />
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
            </head>
            <body
                className={`${poppins.variable} ${lora.variable} antialiased`}
            >
                {children}
            </body>
        </html>
    );
}
