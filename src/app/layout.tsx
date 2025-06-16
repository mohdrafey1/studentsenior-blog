import type { Metadata } from "next";
import { Poppins, Lora } from "next/font/google";
import Script from "next/script"; // ✅ Import Script component
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["600"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Student Senior Blogs",
  description:
    "Explore tech insights, study tips, and college resources crafted by Student Senior.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* ✅ Google AdSense Script (Test Client ID) */}
        <Script
          id="adsense-script"
          async
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-0000000000000000"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${poppins.variable} ${lora.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
