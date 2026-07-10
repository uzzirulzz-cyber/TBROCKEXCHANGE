import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BlockExchange — your home for profits",
  description:
    "BlockExchange is a next-generation crypto trading platform. Predict market movements, trade binary options with up to 50% returns in minutes, and grow your portfolio.",
  keywords: [
    "BlockExchange",
    "crypto",
    "trading",
    "bitcoin",
    "ethereum",
    "binary options",
    "exchange",
  ],
  authors: [{ name: "BlockExchange" }],
  metadataBase: new URL("https://blockexchange.buzz"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/blockexchange-logo.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon-32.png"],
  },
  openGraph: {
    title: "BlockExchange — your home for profits",
    description: "Your home for profits. Predict markets, trade smart, grow your portfolio.",
    siteName: "BlockExchange",
    type: "website",
    url: "https://blockexchange.buzz",
    images: ["/blockexchange-logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "BlockExchange",
    description: "Your home for profits.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
