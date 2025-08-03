"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCurrentIdea } from "@/context/CurrentIdeaContext";
import { useAuth } from "@/context/AuthContext";

export const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { setCurrentIdea } = useCurrentIdea();
  const { user, openModal, logout } = useAuth();

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when menu is open
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
    // Reset the current idea state
    setCurrentIdea(null);
    
    // Navigate to homepage
    router.push('/');
    
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Close mobile menu if open
    setIsMobileMenuOpen(false);
  };

  const handleFeaturesClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  const handleAuthClick = () => {
    if (user) {
      logout();
    } else {
      openModal('signin');
    }
    setIsMobileMenuOpen(false);
  };

  const handleGetStartedClick = () => {
    if (user) {
      // User is signed in, could redirect to dashboard or idea submission
      router.push('/');
    } else {
      openModal('signup');
    }
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div 
              onClick={handleLogoClick}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="p-2 bg-brand/20 rounded-lg">
                <Image
                  src="/logo.svg"
                  alt="GradeIdea logo"
                  width={24}
                  height={24}
                  className="w-6 h-6"
                  aria-hidden="true"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold">GradeIdea</h1>
                <div className="text-xs text-foreground-subtle">.cc</div>
              </div>
            </div>
            <Badge variant="secondary" className="bg-brand/10 text-brand border-brand/20 text-xs">
              Beta
            </Badge>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a 
              href="#features" 
              onClick={handleFeaturesClick}
              className="text-sm font-medium text-foreground-muted hover:text-foreground transition-colors"
            >
              Features
            </a>
            <a href="#pricing" className="text-sm font-medium text-foreground-muted hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="#examples" className="text-sm font-medium text-foreground-muted hover:text-foreground transition-colors">
              Examples
            </a>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Button 
              variant="ghost" 
              className="text-foreground-muted hover:text-foreground"
              onClick={handleAuthClick}
            >
              {user ? 'Sign Out' : 'Sign In'}
            </Button>
            <Button 
              className="btn-primary"
              onClick={handleGetStartedClick}
            >
              {user ? 'My Dashboard' : 'Get Started'}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-surface border-l border-border shadow-xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
      >
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Menu</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={closeMobileMenu}
              className="text-foreground-muted hover:text-foreground"
              aria-label="Close mobile menu"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Mobile Menu Content */}
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            {/* Navigation Links */}
            <nav className="space-y-4">
              <a 
                href="#features" 
                onClick={handleFeaturesClick}
                className="block text-lg font-medium text-foreground-muted hover:text-foreground transition-colors py-2"
              >
                Features
              </a>
              <a 
                href="#pricing" 
                className="block text-lg font-medium text-foreground-muted hover:text-foreground transition-colors py-2"
              >
                Pricing
              </a>
              <a 
                href="#examples" 
                className="block text-lg font-medium text-foreground-muted hover:text-foreground transition-colors py-2"
              >
                Examples
              </a>
            </nav>

            {/* Divider */}
            <div className="border-t border-border my-6" />

            {/* Auth Actions */}
            <div className="space-y-4">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-lg text-foreground-muted hover:text-foreground"
                onClick={handleAuthClick}
              >
                {user ? 'Sign Out' : 'Sign In'}
              </Button>
              <Button 
                className="w-full btn-primary text-lg"
                onClick={handleGetStartedClick}
              >
                {user ? 'My Dashboard' : 'Get Started'}
              </Button>
            </div>

            {/* User Info (if signed in) */}
            {user && (
              <div className="pt-6 border-t border-border">
                <div className="text-sm text-foreground-muted">
                  Signed in as
                </div>
                <div className="text-foreground font-medium truncate">
                  {user.email}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};