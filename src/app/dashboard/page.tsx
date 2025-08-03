"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Coins, 
  Plus, 
  Eye, 
  Calendar,
  TrendingUp,
  Zap,
  HelpCircle,
  Crown
} from "lucide-react";

interface Idea {
  id: string;
  user_id: string;
  idea: string;
  submitted_at: string;
  scores: {
    market: number;
    execution: number;
    monetization: number;
    competition: number;
    growth: number;
  };
  checklist: string[];
  notes?: string;
}

interface UserProfile {
  id: string;
  email: string;
  token_balance: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    // Mock data for MVP - replace with actual Supabase calls
    const mockProfile: UserProfile = {
      id: user.uid,
      email: user.email || '',
      token_balance: 5
    };

    const mockIdeas: Idea[] = [
      {
        id: '1',
        user_id: user.uid,
        idea: 'AI-powered meal planning app for busy professionals with dietary restrictions and grocery delivery integration',
        submitted_at: '2024-01-15T10:30:00Z',
        scores: {
          market: 85,
          execution: 72,
          monetization: 90,
          competition: 68,
          growth: 88
        },
        checklist: ['Define target audience', 'Choose niche market', 'Clarify monetization'],
        notes: 'Great potential but need to focus on specific user segment.'
      },
      {
        id: '2',
        user_id: user.uid,
        idea: 'SaaS platform for small restaurant inventory management with real-time analytics and automated reordering',
        submitted_at: '2024-01-10T14:20:00Z',
        scores: {
          market: 78,
          execution: 65,
          monetization: 82,
          competition: 75,
          growth: 70
        },
        checklist: ['De-risk execution', 'Clarify monetization model'],
        notes: 'Solid market opportunity with clear pain point.'
      }
    ];

    setProfile(mockProfile);
    setIdeas(mockIdeas);
    setLoading(false);
  }, [user, router]);

  const getOverallScore = (scores: Idea['scores']) => {
    const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
    return Math.round(total / Object.keys(scores).length);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-brand';
    return 'text-warning';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin mx-auto"></div>
          <p className="text-foreground-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-foreground-muted">Manage your ideas and track your progress</p>
        </div>

        {/* User Info & Token Balance */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-brand/20 rounded-lg">
                <User className="w-5 h-5 text-brand" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Account</h3>
                <p className="text-sm text-foreground-muted">{profile?.email}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-success/20 rounded-lg">
                <Coins className="w-5 h-5 text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Token Balance</h3>
                <p className="text-2xl font-bold text-success">{profile?.token_balance}</p>
              </div>
            </div>
            <Button className="w-full btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Buy Tokens
            </Button>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-brand/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-brand" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Ideas Analyzed</h3>
                <p className="text-2xl font-bold text-brand">{ideas.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Idea History */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Idea History</h2>
            <Button 
              className="btn-primary"
              onClick={() => router.push('/')}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Idea
            </Button>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface-elevated border-b border-border">
                    <tr>
                      <th className="text-left p-4 font-medium text-foreground">Idea</th>
                      <th className="text-left p-4 font-medium text-foreground">Date Submitted</th>
                      <th className="text-left p-4 font-medium text-foreground">Market Score</th>
                      <th className="text-left p-4 font-medium text-foreground">Execution Score</th>
                      <th className="text-left p-4 font-medium text-foreground">Overall</th>
                      <th className="text-left p-4 font-medium text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ideas.map((idea) => {
                      const overallScore = getOverallScore(idea.scores);
                      return (
                        <tr key={idea.id} className="border-b border-border hover:bg-surface-elevated/50 transition-colors">
                          <td className="p-4">
                            <div className="max-w-xs">
                              <p 
                                className="font-medium text-foreground truncate cursor-help"
                                title={idea.idea}
                              >
                                {idea.idea}
                              </p>
                            </div>
                          </td>
                          <td className="p-4 text-foreground-muted">
                            {formatDate(idea.submitted_at)}
                          </td>
                          <td className="p-4">
                            <span className={`font-semibold ${getScoreColor(idea.scores.market)}`}>
                              {idea.scores.market}%
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`font-semibold ${getScoreColor(idea.scores.execution)}`}>
                              {idea.scores.execution}%
                            </span>
                          </td>
                          <td className="p-4">
                            <Badge 
                              variant="secondary" 
                              className={`font-semibold ${getScoreColor(overallScore)}`}
                            >
                              {overallScore}%
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/dashboard/idea/${idea.id}`)}
                              className="text-brand hover:text-brand/80"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Report
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {ideas.map((idea) => {
              const overallScore = getOverallScore(idea.scores);
              return (
                <Card key={idea.id} className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-medium text-foreground mb-1">{idea.idea}</h3>
                      <p className="text-sm text-foreground-muted flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(idea.submitted_at)}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs text-foreground-muted">Market</p>
                        <p className={`font-semibold ${getScoreColor(idea.scores.market)}`}>
                          {idea.scores.market}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-foreground-muted">Execution</p>
                        <p className={`font-semibold ${getScoreColor(idea.scores.execution)}`}>
                          {idea.scores.execution}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-foreground-muted">Overall</p>
                        <Badge 
                          variant="secondary" 
                          className={`font-semibold ${getScoreColor(overallScore)}`}
                        >
                          {overallScore}%
                        </Badge>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      className="w-full text-brand hover:text-brand/80"
                      onClick={() => router.push(`/dashboard/idea/${idea.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Report
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Support & Upgrade Section */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-warning/20 rounded-lg">
                <HelpCircle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Need Help?</h3>
                <p className="text-sm text-foreground-muted">Get support and report issues</p>
              </div>
            </div>
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start">
                Contact Support
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                Report a Bug
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-brand/20 rounded-lg">
                <Crown className="w-5 h-5 text-brand" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Upgrade to Pro</h3>
                <p className="text-sm text-foreground-muted">Unlock custom MVP plans, deeper scoring, and more</p>
              </div>
            </div>
            <Button className="w-full btn-primary">
              <Zap className="w-4 h-4 mr-2" />
              Join Waitlist
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
} 