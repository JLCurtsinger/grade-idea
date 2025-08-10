import { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Target, 
  DollarSign, 
  Zap,
  Lightbulb,
  ArrowRight,
  Star,
  Search
} from 'lucide-react';
import { getLetterGrade } from '@/lib/gradingScale';

interface PublicIdea {
  id: string;
  ideaText: string;
  baseScores: {
    market: number;
    differentiation: number;
    monetization: number;
    execution: number;
    growth: number;
    overall: number;
  };
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  recommendation?: string | null;
}

// Category keyword mapping for filtering ideas
const categoryKeywords: Record<string, string[]> = {
  ai: ['ai', 'artificial intelligence', 'machine learning', 'ml', 'neural', 'algorithm', 'automation', 'chatbot', 'gpt', 'llm'],
  saas: ['saas', 'software as a service', 'subscription', 'platform', 'dashboard', 'api', 'integration', 'web app', 'cloud'],
  ecommerce: ['ecommerce', 'e-commerce', 'marketplace', 'retail', 'store', 'shopping', 'product', 'inventory', 'payment', 'shipping'],
  healthtech: ['health', 'healthcare', 'medical', 'fitness', 'wellness', 'telemedicine', 'diagnosis', 'treatment', 'patient', 'doctor'],
  fintech: ['fintech', 'financial', 'banking', 'payment', 'investment', 'crypto', 'blockchain', 'lending', 'insurance', 'trading']
};

// Function to check if idea matches category
function ideaMatchesCategory(ideaText: string, category: string): boolean {
  const keywords = categoryKeywords[category.toLowerCase()];
  if (!keywords) return false;
  
  const lowerText = ideaText.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword));
}

// Function to get category display name
function getCategoryDisplayName(category: string): string {
  const displayNames: Record<string, string> = {
    ai: 'AI',
    saas: 'SaaS',
    ecommerce: 'E-commerce',
    healthtech: 'HealthTech',
    fintech: 'FinTech'
  };
  return displayNames[category.toLowerCase()] || category.charAt(0).toUpperCase() + category.slice(1);
}

// Function to format date
function formatDate(timestamp: { seconds: number; nanoseconds: number }) {
  if (!timestamp || !timestamp.seconds || isNaN(timestamp.seconds)) {
    return "Unknown Date";
  }
  
  try {
    const date = new Date(timestamp.seconds * 1000);
    
    if (isNaN(date.getTime())) {
      return "Unknown Date";
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return "Unknown Date";
  }
}

// Function to get score color
function getScoreColor(score: number) {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-600";
}

// Fetch public ideas and filter by category
async function getPublicIdeasByCategory(category: string): Promise<PublicIdea[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/public-ideas`, {
      cache: 'no-store'
    });
    const data = await response.json();
    
    if (data.success) {
      // Filter ideas by category using keyword matching
      return data.ideas.filter((idea: PublicIdea) => 
        ideaMatchesCategory(idea.ideaText, category)
      );
    }
    return [];
  } catch (error) {
    console.error('Error fetching public ideas:', error);
    return [];
  }
}

// Generate metadata for the page
export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const categoryName = getCategoryDisplayName(category);
  
  return {
    title: `Validate ${categoryName} Startup Ideas – GradeIdea.cc`,
    description: `Browse AI-powered validation reports for ${categoryName} startups. Instantly see market potential, monetization clarity, competitive differentiation, and growth potential.`,
    alternates: { 
      canonical: `https://gradeidea.cc/validate/${category}` 
    },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const categoryName = getCategoryDisplayName(category);
  const ideas = await getPublicIdeasByCategory(category);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="py-16 bg-gradient-to-br from-brand/5 via-transparent to-transparent">
        <div className="container mx-auto px-6">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">
              Validate {categoryName} Startup Ideas
            </h1>
            <p className="text-lg text-foreground-muted max-w-3xl mx-auto">
              Explore AI-powered validation reports for {categoryName} startups. See market potential, monetization clarity, competitive differentiation, and growth potential.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-12">
        {ideas.length > 0 ? (
          <div className="space-y-8">
            {/* Ideas List */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Search className="w-6 h-6 text-brand" />
                <h2 className="text-2xl font-semibold text-foreground">
                  {ideas.length} {categoryName} Startup Ideas Found
                </h2>
              </div>
              
              <div className="grid gap-4">
                {ideas.map((idea) => (
                  <Card 
                    key={idea.id} 
                    className="p-6 cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.01]"
                  >
                    <Link href={`/idea/${idea.id}`} className="block">
                      <div className="space-y-4">
                        {/* Idea Text */}
                        <div>
                          <p className="font-medium text-foreground leading-relaxed text-lg">
                            {idea.ideaText}
                          </p>
                          <p className="text-sm text-foreground-muted mt-2">
                            Submitted {formatDate(idea.createdAt)}
                          </p>
                        </div>

                        {/* Overall Score */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-foreground">
                              {idea.baseScores.overall}%
                            </span>
                            {(() => {
                              const { letter, color } = getLetterGrade(idea.baseScores.overall);
                              return (
                                <Badge 
                                  variant="outline" 
                                  className={`text-sm font-medium ${
                                    color === 'green' ? 'text-green-600 border-green-200' :
                                    color === 'lime' ? 'text-lime-600 border-lime-200' :
                                    color === 'yellow' ? 'text-yellow-600 border-yellow-200' :
                                    color === 'orange' ? 'text-orange-600 border-orange-200' :
                                    color === 'red' ? 'text-red-600 border-red-200' :
                                    'text-gray-600 border-gray-200'
                                  }`}
                                >
                                  {letter}
                                </Badge>
                              );
                            })()}
                          </div>
                          <span className="text-sm text-foreground-muted">Overall Score</span>
                        </div>

                        {/* Score Breakdown */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-foreground-muted">Market:</span>
                            <span className={`text-sm font-medium ${getScoreColor(idea.baseScores.market)}`}>
                              {idea.baseScores.market}%
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-[#95FC0F]" />
                            <span className="text-sm text-foreground-muted">Differentiation:</span>
                            <span className={`text-sm font-medium ${getScoreColor(idea.baseScores.differentiation)}`}>
                              {idea.baseScores.differentiation}%
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-foreground-muted">Monetization:</span>
                            <span className={`text-sm font-medium ${getScoreColor(idea.baseScores.monetization)}`}>
                              {idea.baseScores.monetization}%
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-orange-600" />
                            <span className="text-sm text-foreground-muted">Execution:</span>
                            <span className={`text-sm font-medium ${getScoreColor(idea.baseScores.execution)}`}>
                              {idea.baseScores.execution}%
                            </span>
                          </div>
                        </div>

                        {/* View Details CTA */}
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-sm text-foreground-muted">
                            Click to view full validation report
                          </span>
                          <ArrowRight className="w-4 h-4 text-foreground-muted" />
                        </div>
                      </div>
                    </Link>
                  </Card>
                ))}
              </div>
            </div>

            {/* CTA Section */}
            <Card className="p-8 text-center bg-gradient-to-r from-brand/5 to-brand/10">
              <div className="space-y-4">
                <Lightbulb className="w-12 h-12 text-brand mx-auto" />
                <h3 className="text-xl font-semibold text-foreground">
                  Validate Your {categoryName} Startup Idea
                </h3>
                <p className="text-foreground-muted max-w-2xl mx-auto">
                  Get AI-powered insights on your startup idea's market potential, monetization clarity, competitive differentiation, and growth potential.
                </p>
                <Button asChild size="lg" className="mt-4">
                  <Link href="/">
                    Validate Your Idea
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          /* No Ideas Found */
          <Card className="p-12 text-center">
            <div className="space-y-4">
              <Search className="w-16 h-16 text-foreground-muted mx-auto" />
              <h2 className="text-2xl font-semibold text-foreground">
                No public ideas found in {categoryName} yet
              </h2>
              <p className="text-foreground-muted max-w-2xl mx-auto">
                Be the first to submit and validate a {categoryName} startup idea! Our AI will analyze market potential, monetization clarity, competitive differentiation, and growth potential.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                <Button asChild size="lg">
                  <Link href="/">
                    Validate Your {categoryName} Idea
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/examples">
                    Browse All Examples
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
