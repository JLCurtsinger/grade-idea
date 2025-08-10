import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Target, 
  DollarSign, 
  Zap,
  Lightbulb,
  ArrowLeft
} from "lucide-react";
import { getLetterGrade } from "@/lib/gradingScale";
import Link from 'next/link';

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

interface RelatedIdea {
  id: string;
  title: string;
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

async function getIdea(id: string): Promise<PublicIdea | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/public-idea/${id}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.success ? data.idea : null;
  } catch (error) {
    console.error('Error fetching idea:', error);
    return null;
  }
}

async function getRelatedIdeas(currentIdeaId: string): Promise<RelatedIdea[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/related-ideas/${currentIdeaId}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    return data.success ? data.relatedIdeas : [];
  } catch (error) {
    console.error('Error fetching related ideas:', error);
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const idea = await getIdea(id);
  
  if (!idea) {
    return {
      title: 'Idea Not Found | GradeIdea.cc',
      description: 'The startup idea you are looking for could not be found.',
    };
  }

  return {
    title: `${idea.ideaText} – Startup Idea Validation Report | GradeIdea.cc`,
    description: `AI-powered validation report for ${idea.ideaText}. See market potential, monetization clarity, competitive differentiation, and growth potential.`,
    alternates: { 
      canonical: `https://gradeidea.cc/idea/${id}` 
    },
  };
}

export default async function IdeaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idea = await getIdea(id);
  const relatedIdeas = await getRelatedIdeas(id);
  
  if (!idea) {
    notFound();
  }

  const formatDate = (timestamp: { seconds: number; nanoseconds: number }) => {
    if (!timestamp || !timestamp.seconds) {
      return "Unknown Date";
    }
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const generateIdeaSummary = (ideaText: string, recommendation?: string | null) => {
    if (recommendation) {
      return recommendation;
    }
    
    const words = ideaText.toLowerCase().split(' ');
    const keyTerms = words.filter(word => 
      ['saas', 'app', 'platform', 'service', 'tool', 'system', 'solution'].includes(word)
    );
    
    if (keyTerms.length > 0) {
      return `This idea proposes a ${keyTerms[0]} solution that addresses a specific market need.`;
    }
    
    return "This idea presents an innovative solution to address market opportunities.";
  };

  const generateEvaluationSummary = (scores: PublicIdea['baseScores']) => {
    const { letter } = getLetterGrade(scores.overall);
    
    return `The AI evaluation gave this idea an overall grade of ${letter} (${scores.overall}%). The idea shows ${scores.market >= 70 ? 'strong' : scores.market >= 50 ? 'moderate' : 'limited'} market potential, ${scores.monetization >= 70 ? 'clear' : scores.monetization >= 50 ? 'some' : 'unclear'} monetization pathways, ${scores.differentiation >= 70 ? 'strong' : scores.differentiation >= 50 ? 'moderate' : 'limited'} competitive positioning, and ${scores.execution >= 70 ? 'feasible' : scores.execution >= 50 ? 'moderately complex' : 'challenging'} execution requirements.`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/examples"
            className="inline-flex items-center gap-2 text-foreground-muted hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Examples
          </Link>
          
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-foreground leading-tight">
              {idea.ideaText}
            </h1>
            <h2 className="text-2xl font-semibold text-foreground text-brand">
              Startup Idea Validation Report
            </h2>
            <p className="text-foreground-muted">
              Submitted on {formatDate(idea.createdAt)}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Idea Summary */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">Summary</h3>
              <p className="text-foreground-muted leading-relaxed">
                {generateIdeaSummary(idea.ideaText, idea.recommendation)}
              </p>
            </Card>

            {/* AI Evaluation Summary */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">AI Evaluation</h3>
              <p className="text-foreground-muted leading-relaxed">
                {generateEvaluationSummary(idea.baseScores)}
              </p>
            </Card>

            {/* Score Breakdown */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-6">Score Breakdown</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-surface-elevated">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Market Potential</p>
                        <p className="text-sm text-foreground-muted">Market size and demand</p>
                      </div>
                    </div>
                    <span className={`text-2xl font-bold ${getScoreColor(idea.baseScores.market)}`}>
                      {idea.baseScores.market}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-surface-elevated">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-100">
                        <Target className="w-5 h-5 text-[#95FC0F]" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Competitive Differentiation</p>
                        <p className="text-sm text-foreground-muted">Unique positioning</p>
                      </div>
                    </div>
                    <span className={`text-2xl font-bold ${getScoreColor(idea.baseScores.differentiation)}`}>
                      {idea.baseScores.differentiation}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-surface-elevated">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-100">
                        <DollarSign className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Monetization</p>
                        <p className="text-sm text-foreground-muted">Revenue potential</p>
                      </div>
                    </div>
                    <span className={`text-2xl font-bold ${getScoreColor(idea.baseScores.monetization)}`}>
                      {idea.baseScores.monetization}%
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-surface-elevated">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-100">
                        <Zap className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Execution</p>
                        <p className="text-sm text-foreground-muted">Technical complexity</p>
                      </div>
                    </div>
                    <span className={`text-2xl font-bold ${getScoreColor(idea.baseScores.execution)}`}>
                      {idea.baseScores.execution}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-surface-elevated">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-100">
                        <Lightbulb className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Growth Potential</p>
                        <p className="text-sm text-foreground-muted">Scalability</p>
                      </div>
                    </div>
                    <span className={`text-2xl font-bold ${getScoreColor(idea.baseScores.growth)}`}>
                      {idea.baseScores.growth}%
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Related Ideas Section */}
            {relatedIdeas.length > 0 && (
              <Card className="p-6">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Related Startup Ideas</h2>
                <ul className="space-y-2">
                  {relatedIdeas.map((related) => (
                    <li key={related.id}>
                      <Link href={`/idea/${related.id}`} className="text-brand hover:underline">
                        {related.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Overall Grade */}
            <Card className="p-6">
              <h3 className="font-semibold text-foreground mb-4">Overall Grade</h3>
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-4xl font-bold text-foreground">
                    {idea.baseScores.overall}%
                  </span>
                  {(() => {
                    const { letter, color } = getLetterGrade(idea.baseScores.overall);
                    return (
                      <Badge 
                        variant="outline" 
                        className={`text-xl font-medium px-4 py-2 ${
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
                <p className="text-sm text-foreground-muted">
                  AI-powered evaluation score
                </p>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="font-semibold text-foreground mb-4">Try Your Own Idea</h3>
              <div className="space-y-3">
                <Link 
                  href="/"
                  className="block w-full text-center bg-brand text-white py-2 px-4 rounded-lg hover:bg-brand/90 transition-colors"
                >
                  Grade Your Idea
                </Link>
                <Link 
                  href="/examples"
                  className="block w-full text-center border border-border py-2 px-4 rounded-lg hover:bg-surface-elevated transition-colors"
                >
                  View More Examples
                </Link>
              </div>
            </Card>
          </div>
        </div>

        {/* Back to List Link */}
        <div className="mt-8 text-center">
          <Link href="/examples" className="text-brand hover:underline block">
            View All Public Startup Ideas
          </Link>
        </div>
      </div>
    </div>
  );
}
