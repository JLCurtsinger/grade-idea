"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BuyTokensModal } from "@/components/buy-tokens-modal";
import { IdeaDetailModal } from "@/components/IdeaDetailModal";
import { DeleteConfirmationModal } from "@/components/DeleteConfirmationModal";
import { collection, query, orderBy, limit, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
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
  Sparkles,
  RefreshCw,
  Trash2,
  Star,
  Archive
} from "lucide-react";
import { logTokenDisplay, logTokenError } from "@/lib/utils";
import { getLetterGrade } from "@/lib/gradingScale";

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
  starred?: boolean;
  archived?: boolean;
  // Custom fields
  custom?: {
    go_to_market_channels?: string[];
    monetization_models?: string[];
    target_user_archetype?: string;
    target_user_archetypes?: string[];
    key_insights?: string[];
    notes?: Record<string, string>;
    risk_mitigation_plans?: Array<{
      risk: string;
      mitigation: string;
    }>;
  };
}

interface UserProfile {
  id: string;
  email: string;
  token_balance: number;
  totalIdeasSubmitted?: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [archivedIdeas, setArchivedIdeas] = useState<Idea[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBuyTokensModalOpen, setIsBuyTokensModalOpen] = useState(false);
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);
  const [ideasRefreshKey, setIdeasRefreshKey] = useState(0);
  const [forceRefresh, setForceRefresh] = useState(0);
  const [showArchivedIdeas, setShowArchivedIdeas] = useState(false);
  const [updatedIdeaScores, setUpdatedIdeaScores] = useState<Record<string, {
    market_potential: number;
    monetization: number;
    execution: number;
    overall_score: number;
  }>>({});
  
  // Modal state management
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [ideaToDelete, setIdeaToDelete] = useState<Idea | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    const fetchIdeas = async () => {
      try {
        const ideasRef = collection(db, "users", user.uid, "ideas");
        const q = query(ideasRef, orderBy("createdAt", "desc"));
        const querySnap = await getDocs(q);
        const allResults = querySnap.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as Idea[];
        
        // Filter out archived ideas for current ideas section
        const recentIdeas = allResults.filter(idea => !idea.archived);
        // Get archived ideas for past ideas section
        const archivedIdeas = allResults.filter(idea => idea.archived);
        
        // Sort current ideas: starred first, then by creation date (newest first)
        const sortedRecentIdeas = recentIdeas.sort((a, b) => {
          // First sort by starred status (starred ideas first)
          if (a.starred && !b.starred) return -1;
          if (!a.starred && b.starred) return 1;
          // Then sort by creation date (newest first)
          return b.createdAt.seconds - a.createdAt.seconds;
        });
        
        // Sort archived ideas by creation date (newest first)
        const sortedArchivedIdeas = archivedIdeas.sort((a, b) => 
          b.createdAt.seconds - a.createdAt.seconds
        );
        
        setIdeas(sortedRecentIdeas);
        setArchivedIdeas(sortedArchivedIdeas);
      } catch (error) {
        console.error('Error fetching ideas:', error);
        setIdeas([]);
        setArchivedIdeas([]);
      }
    };

    const fetchProfile = async () => {
      try {
        // Fetch actual token balance and total ideas from Firestore
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        let tokenBalance = 0;
        let totalIdeasSubmitted = 0;
        if (userSnap.exists()) {
          const userData = userSnap.data();
          tokenBalance = userData.token_balance ?? 0;
          totalIdeasSubmitted = userData.totalIdeasSubmitted ?? 0;
        }
        
        const profile: UserProfile = {
          id: user.uid,
          email: user.email || '',
          token_balance: tokenBalance,
          totalIdeasSubmitted: totalIdeasSubmitted
        };
        setProfile(profile);
        
        console.log('Dashboard token balance updated from Firestore:', { 
          uid: user.uid, 
          tokenBalance,
          timestamp: new Date().toISOString()
        });
        
        // Log token display
        logTokenDisplay(user.uid, tokenBalance, 'dashboard');
        
      } catch (error) {
        console.error('Error fetching profile:', error);
        logTokenError(user.uid, error instanceof Error ? error.message : 'Unknown error', 'fetch_profile');
      }
    };

    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchIdeas(), fetchProfile()]);
      setLoading(false);
    };

    loadData();
    // Don't clear updated scores - let them persist for user experience
  }, [user, profileRefreshKey, ideasRefreshKey, forceRefresh]);

  // Force refresh token balance on page mount to ensure fresh data
  useEffect(() => {
    if (user) {
      console.log('Dashboard mounted - forcing token balance refresh');
      setProfileRefreshKey(prev => prev + 1);
      setIdeasRefreshKey(prev => prev + 1);
    }
  }, []); // Empty dependency array to run only on mount

  // Refresh profile when window gains focus (after Stripe redirect)
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        console.log('Window focused - refreshing profile and ideas');
        setProfileRefreshKey(prev => prev + 1);
        setIdeasRefreshKey(prev => prev + 1);
        setForceRefresh(prev => prev + 1);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  // Auto-open modal for newly created idea
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const openIdeaId = urlParams.get('open');
      
      if (openIdeaId && ideas.length > 0 && !isDetailModalOpen) {
        const ideaToOpen = ideas.find(idea => idea.id === openIdeaId);
        
        if (ideaToOpen) {
          console.log('Auto-opening modal for idea:', openIdeaId);
          setSelectedIdea(ideaToOpen);
          setIsDetailModalOpen(true);
          
          // Clear the URL parameter to prevent reopening on refresh
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('open');
          window.history.replaceState({}, '', newUrl.toString());
        }
      }
    }
  }, [ideas, isDetailModalOpen]);

  const refreshTokenBalance = () => {
    console.log('Manually refreshing token balance...');
    setProfileRefreshKey(prev => prev + 1);
  };

  const getOverallScore = (analysis: Idea['analysis']) => {
    return analysis.overall_score;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const formatDate = (timestamp: { seconds: number; nanoseconds: number }) => {
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString();
  };

  const handleNewIdea = () => {
    router.push('/');
  };

  const handleBuyTokens = () => {
    setIsBuyTokensModalOpen(true);
  };

  const handleBuyTokensModalClose = () => {
    setIsBuyTokensModalOpen(false);
    // Refresh profile after modal closes to get updated token balance
    console.log('Buy tokens modal closed - refreshing profile');
    setProfileRefreshKey(prev => prev + 1);
  };

  // Modal handlers
  const handleIdeaClick = (idea: Idea) => {
    setSelectedIdea(idea);
    setIsDetailModalOpen(true);
  };

  const handleDetailModalClose = async () => {
    setIsDetailModalOpen(false);
    setSelectedIdea(null);
    
    // Re-fetch ideas to get updated scores from Firestore
    try {
      setIdeasRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error triggering ideas refresh after modal close:', error);
    }
  };

  const updateIdeaScores = (ideaId: string, scores: {
    market_potential: number;
    monetization: number;
    execution: number;
    overall_score: number;
  }) => {
    setUpdatedIdeaScores(prev => ({
      ...prev,
      [ideaId]: scores
    }));
  };

  const handleDeleteClick = (e: React.MouseEvent, idea: Idea) => {
    e.stopPropagation(); // Prevent opening detail modal
    setIdeaToDelete(idea);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteModalClose = () => {
    setIsDeleteModalOpen(false);
    setIdeaToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!ideaToDelete) return;
    
    setIsDeleting(true);
    try {
      // Placeholder delete function - will be wired to Firestore later
      await deleteIdea(ideaToDelete.id);
      
      // Remove from local state
      setIdeas(prev => prev.filter(idea => idea.id !== ideaToDelete.id));
      
      // Close modal
      handleDeleteModalClose();
    } catch (error) {
      console.error('Error deleting idea:', error);
      alert('Failed to delete idea. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Real delete function with Firestore integration
  const deleteIdea = async (ideaId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/deleteIdea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId, idToken }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete idea');
      }

      if (data.success) {
        console.log('Idea deleted successfully:', ideaId);
        return true;
      } else {
        throw new Error(data.error || 'Delete operation failed');
      }
    } catch (error) {
      console.error('Error deleting idea:', error);
      throw error;
    }
  };

  const toggleStar = async (e: React.MouseEvent, idea: Idea) => {
    e.stopPropagation();
    try {
      const ideaRef = doc(db, "users", user.uid, "ideas", idea.id);
      await updateDoc(ideaRef, {
        starred: !idea.starred
      });
      console.log('Idea starred/unstarred:', idea.id, !idea.starred);
      
      // Refresh ideas list
      setIdeasRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  const toggleArchive = async (e: React.MouseEvent, idea: Idea) => {
    e.stopPropagation();
    try {
      const ideaRef = doc(db, "users", user.uid, "ideas", idea.id);
      await updateDoc(ideaRef, {
        archived: !idea.archived
      });
      console.log('Idea archived/unarchived:', idea.id, !idea.archived);
      
      // Refresh ideas list
      setIdeasRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error toggling archive:', error);
    }
  };

  const handleTestEmails = async () => {
    if (!user) return;

    try {
      // Test welcome email
      console.log('Testing welcome email...');
      const welcomeResponse = await fetch('/api/email/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          name: user.displayName || '',
        }),
      });
      
      if (welcomeResponse.ok) {
        toast({
          title: "Welcome Email Test",
          description: "Welcome email sent successfully",
          variant: "default",
        });
      } else {
        throw new Error('Welcome email failed');
      }

      // Test report ready email (using first idea if available)
      if (ideas.length > 0) {
        console.log('Testing report ready email...');
        const reportResponse = await fetch('/api/email/report-ready', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: user.uid,
            ideaId: ideas[0].id,
            email: user.email,
            ideaTitle: ideas[0].ideaText.substring(0, 100),
            reportUrl: `${window.location.origin}/dashboard/idea/${ideas[0].id}`,
          }),
        });
        
        if (reportResponse.ok) {
          toast({
            title: "Report Ready Email Test",
            description: "Report ready email sent successfully",
            variant: "default",
          });
        } else {
          throw new Error('Report ready email failed');
        }
      }

      // Test token confirmation email
      console.log('Testing token confirmation email...');
      const tokenResponse = await fetch('/api/email/token-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          tokensAdded: 10,
          sessionId: "test-session-id"
        }),
      });
      
      if (tokenResponse.ok) {
        toast({
          title: "Token Confirmation Email Test",
          description: "Token confirmation email sent successfully",
          variant: "default",
        });
      } else {
        throw new Error('Token confirmation email failed');
      }

      console.log('All email tests completed successfully');
    } catch (error) {
      console.error('Error testing emails:', error);
      toast({
        title: "Email Test Failed",
        description: error instanceof Error ? error.message : "Failed to test emails",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
            <p className="text-foreground-muted">Track your idea analysis history and token balance</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleNewIdea}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              + New Idea
            </Button>
            <Button 
              onClick={handleBuyTokens}
              className="btn-primary"
            >
              <Coins className="w-4 h-4 mr-2" />
              Buy Tokens
            </Button>
            {/* Development-only test emails button */}
            {process.env.NODE_ENV !== 'production' && (
              <Button 
                onClick={handleTestEmails}
                variant="outline"
                size="sm"
                className="border-orange-500 text-orange-500 hover:bg-orange-500/10"
              >
                Test Emails
              </Button>
            )}
          </div>
        </div>

        {/* Token Balance Card */}
        <Card className="card-glow p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-brand/10 rounded-lg">
                <Coins className="w-6 h-6 text-brand" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Token Balance</h3>
                <p className="text-2xl font-bold text-brand">
                  {profile?.token_balance || 0} tokens
                </p>
              </div>
            </div>
            <Button 
              onClick={refreshTokenBalance}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </Card>

        {/* Ideas History */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Current Ideas</h2>
            <Badge variant="secondary">
              {(() => {
                // Use totalIdeasSubmitted if available, otherwise fallback to ideas.length with "+" indicator
                if (profile?.totalIdeasSubmitted !== undefined && profile.totalIdeasSubmitted > 0) {
                  return `Total Analyzed: ${profile.totalIdeasSubmitted}`;
                } else {
                  // Fallback for older users without the counter
                  return `${ideas.length}+ analyzed`;
                }
              })()}
            </Badge>
          </div>

          {ideas.length === 0 ? (
            <Card className="p-8 text-center">
              <Lightbulb className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No ideas analyzed yet</h3>
              <p className="text-foreground-muted mb-4">
                Start by analyzing your first idea on the homepage
              </p>
              <Button onClick={() => router.push('/')} className="btn-primary">
                Analyze Idea
              </Button>
            </Card>
          ) : (
            <div className="grid gap-6">
              {ideas.map((idea) => (
                <Card 
                  key={idea.id} 
                  className="p-6 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.01]"
                  onClick={() => handleIdeaClick(idea)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {idea.ideaText}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-foreground-muted">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(idea.createdAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Coins className="w-4 h-4" />
                          {idea.tokensUsed} token{idea.tokensUsed !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={idea.analysis.recommendation === "Worth Building" ? "default" : "secondary"}
                        className="ml-4"
                      >
                        {idea.analysis.recommendation}
                      </Badge>
                      <button
                        onClick={(e) => toggleStar(e, idea)}
                        className={`p-2 rounded-full transition-colors ${
                          idea.starred 
                            ? 'text-yellow-500 hover:text-yellow-600' 
                            : 'text-foreground-muted hover:text-yellow-500'
                        }`}
                        title={idea.starred ? "Unstar idea" : "Star idea"}
                      >
                        <Star className={`w-4 h-4 ${idea.starred ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={(e) => toggleArchive(e, idea)}
                        className="p-2 text-foreground-muted hover:text-blue-600 rounded-full transition-colors"
                        title="Move to Past Ideas"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(e, idea)}
                        className="p-2 text-foreground-muted hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Delete idea"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Score Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-surface rounded-lg">
                      <div className="text-sm text-foreground-muted mb-1">Overall</div>
                      <div className="flex items-center justify-center gap-2">
                        {(() => {
                          const updatedScores = updatedIdeaScores[idea.id];
                          const overallScore = updatedScores ? updatedScores.overall_score : getOverallScore(idea.analysis);
                          const { letter, color } = getLetterGrade(overallScore);
                          return (
                            <>
                              <div className={`text-lg font-bold transition-all duration-300 ${getScoreColor(overallScore)}`}>
                                {overallScore}%
                              </div>
                              <div className={`text-lg font-bold transition-all duration-300 ${
                                color === 'green' ? 'text-green-600' :
                                color === 'lime' ? 'text-lime-600' :
                                color === 'yellow' ? 'text-yellow-600' :
                                color === 'orange' ? 'text-orange-600' :
                                color === 'red' ? 'text-red-600' :
                                'text-gray-600'
                              }`}>
                                {letter}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-surface rounded-lg">
                      <div className="text-sm text-foreground-muted mb-1">Market</div>
                      <div className={`text-lg font-bold transition-all duration-300 ${getScoreColor(updatedIdeaScores[idea.id]?.market_potential ?? idea.analysis.market_potential)}`}>
                        {updatedIdeaScores[idea.id]?.market_potential ?? idea.analysis.market_potential}%
                      </div>
                    </div>
                    <div className="text-center p-3 bg-surface rounded-lg">
                      <div className="text-sm text-foreground-muted mb-1">Competition</div>
                      <div className={`text-lg font-bold transition-all duration-300 ${getScoreColor(idea.analysis.competition)}`}>
                        {idea.analysis.competition}%
                      </div>
                    </div>
                    <div className="text-center p-3 bg-surface rounded-lg">
                      <div className="text-sm text-foreground-muted mb-1">Execution</div>
                      <div className={`text-lg font-bold transition-all duration-300 ${getScoreColor(updatedIdeaScores[idea.id]?.execution ?? idea.analysis.execution)}`}>
                        {updatedIdeaScores[idea.id]?.execution ?? idea.analysis.execution}%
                      </div>
                    </div>
                  </div>

                  {/* Insights */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">Key Insights</h4>
                    <ul className="space-y-1">
                      {idea.analysis.insights.slice(0, 3).map((insight, index) => (
                        <li key={index} className="text-sm text-foreground-muted flex items-start gap-2">
                          <div className="w-1 h-1 bg-brand rounded-full mt-2 flex-shrink-0"></div>
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Past Ideas Section */}
        {archivedIdeas.length > 0 && (
          <div className="space-y-6 mt-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-foreground">Past Ideas</h2>
                <Badge variant="outline">{archivedIdeas.length} archived</Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowArchivedIdeas(!showArchivedIdeas)}
              >
                {showArchivedIdeas ? 'Hide' : 'Show'} Past Ideas
              </Button>
            </div>

            {showArchivedIdeas && (
              <div className="grid gap-6">
                {archivedIdeas.map((idea) => (
                  <Card 
                    key={idea.id} 
                    className="p-6 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.01] opacity-75"
                    onClick={() => handleIdeaClick(idea)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          {idea.ideaText}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-foreground-muted">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(idea.createdAt)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Coins className="w-4 h-4" />
                            {idea.tokensUsed} token{idea.tokensUsed !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={idea.analysis.recommendation === "Worth Building" ? "default" : "secondary"}
                          className="ml-4"
                        >
                          {idea.analysis.recommendation}
                        </Badge>
                        <button
                          onClick={(e) => toggleStar(e, idea)}
                          className={`p-2 rounded-full transition-colors ${
                            idea.starred 
                              ? 'text-yellow-500 hover:text-yellow-600' 
                              : 'text-foreground-muted hover:text-yellow-500'
                          }`}
                          title={idea.starred ? "Unstar idea" : "Star idea"}
                        >
                          <Star className={`w-4 h-4 ${idea.starred ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          onClick={(e) => toggleArchive(e, idea)}
                          className="p-2 text-blue-600 hover:text-blue-700 rounded-full transition-colors"
                          title="Move to Current Ideas"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteClick(e, idea)}
                          className="p-2 text-foreground-muted hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          title="Delete idea"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Score Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-surface rounded-lg">
                        <div className="text-sm text-foreground-muted mb-1">Overall</div>
                        <div className="flex items-center justify-center gap-2">
                          {(() => {
                            const updatedScores = updatedIdeaScores[idea.id];
                            const overallScore = updatedScores ? updatedScores.overall_score : getOverallScore(idea.analysis);
                            const { letter, color } = getLetterGrade(overallScore);
                            return (
                              <>
                                <div className={`text-lg font-bold transition-all duration-300 ${getScoreColor(overallScore)}`}>
                                  {overallScore}%
                                </div>
                                <div className={`text-lg font-bold transition-all duration-300 ${
                                  color === 'green' ? 'text-green-600' :
                                  color === 'lime' ? 'text-lime-600' :
                                  color === 'yellow' ? 'text-yellow-600' :
                                  color === 'orange' ? 'text-orange-600' :
                                  color === 'red' ? 'text-red-600' :
                                  'text-gray-600'
                                }`}>
                                  {letter}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-surface rounded-lg">
                        <div className="text-sm text-foreground-muted mb-1">Market</div>
                        <div className={`text-lg font-bold transition-all duration-300 ${getScoreColor(updatedIdeaScores[idea.id]?.market_potential ?? idea.analysis.market_potential)}`}>
                          {updatedIdeaScores[idea.id]?.market_potential ?? idea.analysis.market_potential}%
                        </div>
                      </div>
                      <div className="text-center p-3 bg-surface rounded-lg">
                        <div className="text-sm text-foreground-muted mb-1">Competition</div>
                        <div className={`text-lg font-bold transition-all duration-300 ${getScoreColor(idea.analysis.competition)}`}>
                          {idea.analysis.competition}%
                        </div>
                      </div>
                      <div className="text-center p-3 bg-surface rounded-lg">
                        <div className="text-sm text-foreground-muted mb-1">Execution</div>
                        <div className={`text-lg font-bold transition-all duration-300 ${getScoreColor(updatedIdeaScores[idea.id]?.execution ?? idea.analysis.execution)}`}>
                          {updatedIdeaScores[idea.id]?.execution ?? idea.analysis.execution}%
                        </div>
                      </div>
                    </div>

                    {/* Insights */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-foreground">Key Insights</h4>
                      <ul className="space-y-1">
                        {idea.analysis.insights.slice(0, 3).map((insight, index) => (
                          <li key={index} className="text-sm text-foreground-muted flex items-start gap-2">
                            <div className="w-1 h-1 bg-brand rounded-full mt-2 flex-shrink-0"></div>
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Buy Tokens Modal */}
      <BuyTokensModal 
        isOpen={isBuyTokensModalOpen} 
        onClose={handleBuyTokensModalClose} 
      />

      {/* Idea Detail Modal */}
      <IdeaDetailModal
        idea={selectedIdea}
        isOpen={isDetailModalOpen}
        onClose={handleDetailModalClose}
        onScoreUpdate={(scores) => {
          if (selectedIdea) {
            updateIdeaScores(selectedIdea.id, scores);
          }
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteModalClose}
        onConfirm={handleDeleteConfirm}
        ideaText={ideaToDelete?.ideaText}
        isLoading={isDeleting}
      />
    </div>
  );
} 