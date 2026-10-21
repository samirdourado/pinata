import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { AuthProvider } from "@/components/AuthProvider";
import { Navbar } from "@/components/Navbar";
import { SocialProvider } from "@/components/SocialProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pinata",
  description:
    "A Web3 social network that eliminates spam and rewards high-value engagement with the Piñata Pool.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-US"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <SocialProvider>
            <Suspense
              fallback={
                <div className="sticky top-0 z-50 h-17 border-b border-card-border bg-card" />
              }
            >
              <Navbar />
            </Suspense>
            {children}
          </SocialProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
