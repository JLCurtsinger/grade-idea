import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";
import { CurrentIdeaProvider } from "@/context/CurrentIdeaContext";
import { AuthProvider } from "@/context/AuthContext";
import { SignInModal } from "@/components/auth/SignInModal";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Validate Your Startup Idea in Minutes – GradeIdea.cc',
  description:
    "Get an AI-powered, founder-grade validation report for your startup idea. Score market potential, monetization, and growth – instantly.",
  alternates: {
    canonical: 'https://gradeidea.cc',
  },
  openGraph: {
    type: 'website',
    url: 'https://gradeidea.cc',
    title: 'Validate Your Startup Idea in Minutes – GradeIdea.cc',
    description:
      "Get an AI-powered, founder-grade validation report for your startup idea. Score market potential, monetization, and growth – instantly.",
    siteName: 'GradeIdea.cc',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Validate Your Startup Idea in Minutes – GradeIdea.cc',
    description:
      "Get an AI-powered, founder-grade validation report for your startup idea. Score market potential, monetization, and growth – instantly.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <AuthProvider>
            <CurrentIdeaProvider>
              <Header />
              {children}
              <SignInModal />
            </CurrentIdeaProvider>
          </AuthProvider>
        </Providers>
        <GoogleAnalytics />
        <Toaster />
      </body>
    </html>
  );
} 