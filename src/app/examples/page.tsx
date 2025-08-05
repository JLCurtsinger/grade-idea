"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Target, 
  DollarSign, 
  Zap,
  Lightbulb,
  ArrowRight,
  Star,
  RefreshCw
} from "lucide-react";
import { getLetterGrade } from "@/lib/gradingScale";
import { useRouter } from "next/navigation";
import { TopIdeaModal } from "@/components/TopIdeaModal";

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
}

const examplePrompts = [
  "An app that lets roommates split bills automatically",
  "A subscription box for rare houseplants",
  "An AI that critiques pitch decks for startups",
  "A platform for local farmers to sell directly to consumers",
  "An app that gamifies learning new languages",
  "A service that helps small businesses automate their social media"
];

export default function ExamplesPage() {
  const [publicIdeas, setPublicIdeas] = useState<PublicIdea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<PublicIdea | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchPublicIdeas();
  }, []);

  const fetchPublicIdeas = async () => {
    try {
      const response = await fetch('/api/public-ideas');
      const data = await response.json();
      
      if (process.env.NODE_ENV === 'development') {
        console.log("[DEBUG] Fetched public ideas:", data);
      }
      
      if (data.success) {
        setPublicIdeas(data.ideas);
      }
    } catch (error) {
      console.error('Error fetching public ideas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshIdeas = async () => {
    setIsRefreshing(true);
    await fetchPublicIdeas();
    setIsRefreshing(false);
  };

  const handleIdeaClick = (idea: PublicIdea) => {
    setSelectedIdea(idea);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedIdea(null);
  };

  const handleExampleClick = (prompt: string) => {
    // Encode the prompt for URL parameter
    const encodedPrompt = encodeURIComponent(prompt);
    router.push(`/?example=${encodedPrompt}`);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const formatDate = (timestamp: { seconds: number; nanoseconds: number }) => {
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="py-16 bg-gradient-to-br from-brand/5 via-transparent to-transparent">
        <div className="container mx-auto px-6">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">
              Startup Idea Examples
            </h1>
            <p className="text-lg text-foreground-muted max-w-2xl mx-auto">
              Get inspired by top-rated startup ideas and try our example prompts to see how GradeIdea works.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Section A: Example Prompts */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Lightbulb className="w-6 h-6 text-brand" />
              <h2 className="text-2xl font-semibold text-foreground">
                Try these example prompts
              </h2>
            </div>
            <p className="text-foreground-muted">
              Click any example below to see how GradeIdea analyzes startup ideas. These will be filled into the input on the homepage.
            </p>
            
            <div className="grid gap-3">
              {examplePrompts.map((prompt, index) => (
                <Card key={index} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-auto p-0 text-left"
                    onClick={() => handleExampleClick(prompt)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{prompt}</p>
                        <p className="text-sm text-foreground-muted mt-1">
                          Click to try this example
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-foreground-muted ml-2" />
                    </div>
                  </Button>
                </Card>
              ))}
            </div>
          </div>

          {/* Section B: Top Public Ideas */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Star className="w-6 h-6 text-brand" />
                <h2 className="text-2xl font-semibold text-foreground">
                  Top Public Ideas
                </h2>
              </div>
              {process.env.NODE_ENV === 'development' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshIdeas}
                  disabled={isRefreshing}
                  className="text-xs"
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh Ideas
                </Button>
              )}
            </div>
            <p className="text-foreground-muted">
              These are the highest-rated startup ideas submitted by users who chose to make them public. Scores shown are from the original LLM evaluation. See how your idea compares!
            </p>

            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <Card key={index} className="p-4 animate-pulse">
                    <div className="h-4 bg-surface-elevated rounded mb-2"></div>
                    <div className="h-3 bg-surface-elevated rounded mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-surface-elevated rounded"></div>
                      <div className="h-3 bg-surface-elevated rounded w-3/4"></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : publicIdeas.length > 0 ? (
              <div className="space-y-4">
                {publicIdeas.map((idea, index) => (
                  <Card 
                    key={idea.id} 
                    className="p-4 cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.01]"
                    onClick={() => handleIdeaClick(idea)}
                  >
                    <div className="space-y-3">
                      {/* Idea Text */}
                      <div>
                        <p className="font-medium text-foreground leading-relaxed">
                          {idea.ideaText}
                        </p>
                        <p className="text-xs text-foreground-muted mt-1">
                          Submitted {formatDate(idea.createdAt)}
                        </p>
                      </div>

                      {/* Overall Score */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-foreground">
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
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-foreground-muted">Market:</span>
                          <span className={`text-sm font-medium ${getScoreColor(idea.baseScores.market)}`}>
                            {idea.baseScores.market}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-purple-600" />
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
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <div className="space-y-3">
                  <Lightbulb className="w-12 h-12 text-foreground-muted mx-auto" />
                  <h3 className="text-lg font-medium text-foreground">No public ideas yet</h3>
                  <p className="text-foreground-muted">
                    Be the first to make your idea public and see it featured here!
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Top Idea Modal */}
      <TopIdeaModal
        idea={selectedIdea}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </div>
  );
} 