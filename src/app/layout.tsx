import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "kadellabs — AI-Powered Video Interview Platform",
  description:
    "kadellabs is the modern AI-powered video interview screening platform for teams that want to hire smarter, faster, and more fairly.",
  keywords: ["video interview", "AI screening", "recruitment", "HR SaaS", "candidate interview", "kadellabs"],
  openGraph: {
    title: "kadellabs — AI-Powered Video Interview Platform",
    description: "Screen candidates with AI-guided video interviews. One link, one interview, smarter hiring decisions.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
