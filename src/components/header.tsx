"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCurrentIdea } from "@/context/CurrentIdeaContext";

export const Header = () => {
  const router = useRouter();
  const { setCurrentIdea } = useCurrentIdea();

  const handleLogoClick = () => {
    // Reset the current idea state
    setCurrentIdea(null);
    
    // Navigate to homepage
    router.push('/');
    
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-foreground-muted hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-sm font-medium text-foreground-muted hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="#examples" className="text-sm font-medium text-foreground-muted hover:text-foreground transition-colors">
              Examples
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="hidden sm:inline-flex text-foreground-muted hover:text-foreground">
              Sign In
            </Button>
            <Button className="btn-primary">
              Get Started
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};