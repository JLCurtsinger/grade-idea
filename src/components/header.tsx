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

  // Handle hash navigation on landing page
  useEffect(() => {
    if (isLandingPage && typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash) {
        // Small delay to ensure the page is fully loaded
        setTimeout(() => {
          const targetElement = document.querySelector(hash);
          if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    }
  }, [isLandingPage]);

  const handleLogoClick = () => {
    setCurrentIdea(null);
    router.push('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  };

  const handleFeaturesClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    if (isLandingPage) {
      // On landing page, scroll smoothly to the section
      const featuresSection = document.getElementById('features');
      if (featuresSection) {
        featuresSection.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // On other pages, navigate to landing page with hash
      router.push('/#features');
    }
    
    setIsMobileMenuOpen(false);
  };

  const handlePricingClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    if (isLandingPage) {
      // On landing page, scroll smoothly to the section
      const pricingSection = document.getElementById('pricing');
      if (pricingSection) {
        pricingSection.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // On other pages, navigate to landing page with hash
      router.push('/#pricing');
    }
    
    setIsMobileMenuOpen(false);
  };

  const handleHowItWorksClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    if (isLandingPage) {
      // On landing page, scroll smoothly to the section
      const howItWorksSection = document.getElementById('how-it-works');
      if (howItWorksSection) {
        howItWorksSection.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // On other pages, navigate to landing page with hash
      router.push('/#how-it-works');
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
      router.push('/dashboard');
    } else {
      openModal('signup');
    }
    setIsMobileMenuOpen(false);
  };

  const handleDashboardClick = () => {
    router.push('/dashboard');
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
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
                  <h1 className="text-xl font-bold tracking-tight sm:tracking-normal">
                    <span className="tropical-logo-gradient">GradeIdea</span>
                  </h1>
                  <div className="text-xs text-foreground-subtle">.cc</div>
                </div>
              </div>
              <Badge variant="secondary" className="bg-brand/10 text-brand border-brand/20 text-xs">
                V1
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
              <a 
                href="#pricing" 
                onClick={handlePricingClick}
                className="text-sm font-medium text-foreground-muted hover:text-foreground transition-colors"
              >
                Pricing
              </a>
              <a href="/examples" className="text-sm font-medium text-foreground-muted hover:text-foreground transition-colors">
                Examples
              </a>
              <a 
                href="#how-it-works" 
                onClick={handleHowItWorksClick}
                className="text-sm font-medium text-foreground-muted hover:text-foreground transition-colors"
              >
                How It Works
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
                {user ? 'Dashboard' : 'Get Started'}
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
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-surface border-l border-border shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
      >
        {/* Mobile Menu Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-surface-elevated">
          <h2 className="text-xl font-semibold text-foreground">Menu</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeMobileMenu}
            className="text-foreground-muted hover:text-foreground"
            aria-label="Close mobile menu"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Mobile Menu Content */}
        <div className="flex flex-col h-full">
          <div className="flex-1 p-6 space-y-8">
            {/* Navigation Links */}
            <nav className="space-y-6">
              <a 
                href="#features" 
                onClick={handleFeaturesClick}
                className="block text-lg font-medium text-foreground-muted hover:text-foreground transition-colors py-3 border-b border-border/50"
              >
                Features
              </a>
              <a 
                href="#pricing" 
                onClick={handlePricingClick}
                className="block text-lg font-medium text-foreground-muted hover:text-foreground transition-colors py-3 border-b border-border/50"
              >
                Pricing
              </a>
              <a 
                href="/examples" 
                className="block text-lg font-medium text-foreground-muted hover:text-foreground transition-colors py-3 border-b border-border/50"
              >
                Examples
              </a>
              <a 
                href="#how-it-works" 
                onClick={handleHowItWorksClick}
                className="block text-lg font-medium text-foreground-muted hover:text-foreground transition-colors py-3 border-b border-border/50"
              >
                How It Works
              </a>
            </nav>

            {/* Auth Actions */}
            <div className="space-y-4">
              <Button 
                className="w-full btn-primary text-lg py-4"
                onClick={handleGetStartedClick}
              >
                {user ? 'Dashboard' : 'Get Started'}
              </Button>
              
              {user && (
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-lg text-foreground-muted hover:text-foreground py-4"
                  onClick={handleAuthClick}
                >
                  Sign Out
                </Button>
              )}
            </div>

            {/* User Info (if signed in) */}
            {user && (
              <div className="pt-6 border-t border-border">
                <div className="text-sm text-foreground-muted mb-2">
                  Signed in as
                </div>
                <div className="text-foreground font-medium truncate">
                  {user.email}
                </div>
              </div>
            )}

            {/* Sign In (if not signed in) */}
            {!user && (
              <div className="pt-6 border-t border-border">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-lg text-foreground-muted hover:text-foreground py-4"
                  onClick={handleAuthClick}
                >
                  Sign In
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};