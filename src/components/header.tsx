"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useCurrentIdea } from "@/context/CurrentIdeaContext";
import { useAuth } from "@/context/AuthContext";

export const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { setCurrentIdea } = useCurrentIdea();
  const { user, openModal, logout } = useAuth();
  
  // Check if we're on the landing page
  const isLandingPage = pathname === '/';

  // Handle escape key and body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const handleLogoClick = () => {
    setCurrentIdea(null, null);
    router.push('/');
  };

  const handleSignIn = () => {
    openModal('signin');
  };

  const handleSignUp = () => {
    openModal('signup');
  };

  const handleDashboard = () => {
    router.push('/dashboard');
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleLogoClick}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Image
                src="/logo.svg"
                alt="GradeIdea"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span className="text-xl font-bold text-gradient">GradeIdea</span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                <Button
                  onClick={handleDashboard}
                  variant="ghost"
                  className="text-foreground hover:text-brand"
                >
                  Dashboard
                </Button>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-brand/10 text-brand">
                    {user.email}
                  </Badge>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="sm"
                  >
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button
                  onClick={handleSignIn}
                  variant="ghost"
                  className="text-foreground hover:text-brand"
                >
                  Sign In
                </Button>
                <Button
                  onClick={handleSignUp}
                  className="btn-primary"
                >
                  Sign Up
                </Button>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-md hover:bg-surface transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              {user ? (
                <>
                  <Button
                    onClick={handleDashboard}
                    variant="ghost"
                    className="justify-start text-foreground hover:text-brand"
                  >
                    Dashboard
                  </Button>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-brand/10 text-brand">
                      {user.email}
                    </Badge>
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      size="sm"
                    >
                      Logout
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleSignIn}
                    variant="ghost"
                    className="justify-start text-foreground hover:text-brand"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={handleSignUp}
                    className="btn-primary justify-start"
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};