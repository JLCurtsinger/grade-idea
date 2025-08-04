import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";
import { CurrentIdeaProvider } from "@/context/CurrentIdeaContext";
import { AuthProvider } from "@/context/AuthContext";
import { SignInModal } from "@/components/auth/SignInModal";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GradeIdea - AI-Powered Business Idea Validation",
  description: "Validate your business ideas with our AI-powered scoring system. Get instant feedback on market potential, feasibility, and growth opportunities.",
  icons: {
    icon: "/favicon.ico",
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
      </body>
    </html>
  );
} 