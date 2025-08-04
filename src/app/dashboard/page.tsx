"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BuyTokensModal } from "@/components/buy-tokens-modal";
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  User, 
  Coins, 
  Plus, 
  Eye, 
  Calendar,
  TrendingUp,
  Zap,
  HelpCircle,
  Crown,
  Lightbulb,
  Sparkles
} from "lucide-react";

interface Idea {
  id: string;
  ideaText: string;
  analysis: {
    overall_score: number;
    market_potential: number;
    competition: number;
    monetization: number;
    execution: number;
    recommendation: string;
    insights: string[];
  };
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  tokensUsed: number;
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
  const [isBuyTokensModalOpen, setIsBuyTokensModalOpen] = useState(false);
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    const fetchIdeas = async () => {
      try {
        const ideasRef = collection(db, "users", user.uid, "ideas");
        const q = query(ideasRef, orderBy("createdAt", "desc"), limit(10));
        const querySnap = await getDocs(q);
        const results = querySnap.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as Idea[];
        setIdeas(results);
      } catch (error) {
        console.error('Error fetching ideas:', error);
        setIdeas([]);
      }
    };

    const fetchProfile = async () => {
      try {
        // Fetch actual token balance from Firestore
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        let tokenBalance = 0;
        if (userSnap.exists()) {
          tokenBalance = userSnap.data().token_balance ?? 0;
        }
        
        const profile: UserProfile = {
          id: user.uid,
          email: user.email || '',
          token_balance: tokenBalance
        };
        setProfile(profile);
        
        console.log('Dashboard token balance updated:', { 
          uid: user.uid, 
          tokenBalance 
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        // Fallback to 0 tokens if there's an error
        const profile: UserProfile = {
          id: user.uid,
          email: user.email || '',
          token_balance: 0
        };
        setProfile(profile);
      }
    };

    fetchIdeas();
    fetchProfile();
    setLoading(false);
  }, [user, router, profileRefreshKey]);

  // Refresh profile when user returns from Stripe checkout
  useEffect(() => {
    const handleFocus = () => {
      // Refresh profile when user returns to the tab
      console.log('Window focused, refreshing token balance...');
      setProfileRefreshKey(prev => prev + 1);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Function to manually refresh token balance
  const refreshTokenBalance = () => {
    console.log('Manually refreshing token balance...');
    setProfileRefreshKey(prev => prev + 1);
  };

  const getOverallScore = (analysis: Idea['analysis']) => {
    return analysis.overall_score;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-brand';
    return 'text-warning';
  };

  const formatDate = (timestamp: { seconds: number; nanoseconds: number }) => {
    return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleBuyTokens = () => {
    if (!user) {
      alert('Please sign in to purchase tokens. You can sign in using the button in the header.');
      return;
    }
    
    setIsBuyTokensModalOpen(true);
  };

  const handleBuyTokensModalClose = () => {
    setIsBuyTokensModalOpen(false);
    // Refresh profile to get updated token balance
    setProfileRefreshKey(prev => prev + 1);
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
            <Button 
              className="w-full btn-primary"
              onClick={handleBuyTokens}
            >
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
            {ideas.length > 0 && (
              <Button 
                className="btn-primary"
                onClick={() => router.push('/')}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Idea
              </Button>
            )}
          </div>

          {ideas.length === 0 ? (
            /* Empty State */
            <Card className="p-12 text-center">
              <div className="max-w-md mx-auto space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lightbulb className="w-10 h-10 text-brand" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-brand/20 rounded-full flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-brand" />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-foreground">No ideas submitted yet</h3>
                  <p className="text-foreground-muted">
                    Ready to validate your next big idea? Get started with your first submission and see how it scores.
                  </p>
                </div>

                <Button 
                  className="btn-primary"
                  onClick={() => router.push('/')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  + New Idea
                </Button>
              </div>
            </Card>
          ) : (
            /* Idea History Content */
            <>
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
                          const overallScore = getOverallScore(idea.analysis);
                          return (
                            <tr key={idea.id} className="border-b border-border hover:bg-surface-elevated/50 transition-colors">
                              <td className="p-4">
                                <div className="max-w-xs">
                                  <p 
                                    className="font-medium text-foreground truncate cursor-help"
                                    title={idea.ideaText}
                                  >
                                    {idea.ideaText}
                                  </p>
                                </div>
                              </td>
                              <td className="p-4 text-foreground-muted">
                                {formatDate(idea.createdAt)}
                              </td>
                              <td className="p-4">
                                <span className={`font-semibold ${getScoreColor(idea.analysis.market_potential)}`}>
                                  {idea.analysis.market_potential}%
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`font-semibold ${getScoreColor(idea.analysis.execution)}`}>
                                  {idea.analysis.execution}%
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
                  const overallScore = getOverallScore(idea.analysis);
                  return (
                    <Card key={idea.id} className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-medium text-foreground mb-1">{idea.ideaText}</h3>
                          <p className="text-sm text-foreground-muted flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {formatDate(idea.createdAt)}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-xs text-foreground-muted">Market</p>
                            <p className={`font-semibold ${getScoreColor(idea.analysis.market_potential)}`}>
                              {idea.analysis.market_potential}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-foreground-muted">Execution</p>
                            <p className={`font-semibold ${getScoreColor(idea.analysis.execution)}`}>
                              {idea.analysis.execution}%
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
            </>
          )}
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

      {/* Buy Tokens Modal */}
      <BuyTokensModal 
        isOpen={isBuyTokensModalOpen}
        onClose={handleBuyTokensModalClose}
      />
    </div>
  );
} 