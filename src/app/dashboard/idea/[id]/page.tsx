"use client";

import { useEffect, useState } from "react";
import Head from 'next/head';
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowLeft, 
  TrendingUp, 
  Target, 
  DollarSign, 
  Zap, 
  Users,
  CheckCircle,
  Edit,
  Copy,
  RefreshCw,
  Plus
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

export default function IdeaEvaluationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const ideaId = params.id as string;
  
  const [idea, setIdea] = useState<Idea | null>(null);
  const [notes, setNotes] = useState("");
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    // Mock data for MVP - replace with actual Supabase call
    const mockIdea: Idea = {
      id: ideaId,
      user_id: user.uid,
      idea: 'AI-powered meal planning app for busy professionals',
      submitted_at: '2024-01-15T10:30:00Z',
      scores: {
        market: 85,
        execution: 72,
        monetization: 90,
        competition: 68,
        growth: 88
      },
      checklist: [
        'Define your target audience better',
        'Choose a more niche market',
        'Clarify monetization model',
        'De-risk execution with no-code MVP'
      ],
      notes: 'Great potential but need to focus on specific user segment.'
    };

    setIdea(mockIdea);
    setNotes(mockIdea.notes || "");
    setLoading(false);
  }, [user, router, ideaId]);

  const getOverallScore = (scores: Idea['scores']) => {
    const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
    return Math.round(total / Object.keys(scores).length);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-brand';
    return 'text-warning';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-success/20';
    if (score >= 60) return 'bg-brand/20';
    return 'bg-warning/20';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleChecklistToggle = (item: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(item)) {
      newChecked.delete(item);
    } else {
      newChecked.add(item);
    }
    setCheckedItems(newChecked);
  };

  const handleSaveNotes = () => {
    // TODO: Save to Supabase
    console.log('Saving notes:', notes);
  };

  const handleDuplicateIdea = () => {
    // TODO: Duplicate idea and redirect to homepage with pre-filled form
    router.push('/');
  };

  const handleReEvaluate = () => {
    // TODO: Implement re-evaluation logic
    console.log('Re-evaluating idea');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin mx-auto"></div>
          <p className="text-foreground-muted">Loading idea evaluation...</p>
        </div>
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Idea Not Found</h2>
          <p className="text-foreground-muted">The idea you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const overallScore = getOverallScore(idea.scores);

  return (
    <>
      <Head>
        <link rel="canonical" href={`https://gradeidea.cc/dashboard/idea/${ideaId}`} />
      </Head>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/dashboard')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{idea.idea}</h1>
                <p className="text-foreground-muted">Submitted on {formatDate(idea.submitted_at)}</p>
              </div>
              
              <Badge 
                variant="secondary" 
                className={`text-lg font-bold ${getScoreColor(overallScore)}`}
              >
                {overallScore}% Overall Score
              </Badge>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Score Breakdown */}
              <Card className="p-6">
                <h2 className="text-xl font-bold text-foreground mb-6">Score Breakdown</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-surface-elevated">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getScoreBgColor(idea.scores.market)}`}>
                          <TrendingUp className="w-5 h-5 text-brand" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Market Potential</p>
                          <p className="text-sm text-foreground-muted">Market size and demand</p>
                        </div>
                      </div>
                      <span className={`text-2xl font-bold ${getScoreColor(idea.scores.market)}`}>
                        {idea.scores.market}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg bg-surface-elevated">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getScoreBgColor(idea.scores.execution)}`}>
                          <Zap className="w-5 h-5 text-brand" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Execution Difficulty</p>
                          <p className="text-sm text-foreground-muted">Technical complexity</p>
                        </div>
                      </div>
                      <span className={`text-2xl font-bold ${getScoreColor(idea.scores.execution)}`}>
                        {idea.scores.execution}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg bg-surface-elevated">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getScoreBgColor(idea.scores.monetization)}`}>
                          <DollarSign className="w-5 h-5 text-brand" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Monetization</p>
                          <p className="text-sm text-foreground-muted">Revenue potential</p>
                        </div>
                      </div>
                      <span className={`text-2xl font-bold ${getScoreColor(idea.scores.monetization)}`}>
                        {idea.scores.monetization}%
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-surface-elevated">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getScoreBgColor(idea.scores.competition)}`}>
                          <Target className="w-5 h-5 text-brand" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Competition</p>
                          <p className="text-sm text-foreground-muted">Market competition</p>
                        </div>
                      </div>
                      <span className={`text-2xl font-bold ${getScoreColor(idea.scores.competition)}`}>
                        {idea.scores.competition}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg bg-surface-elevated">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getScoreBgColor(idea.scores.growth)}`}>
                          <Users className="w-5 h-5 text-brand" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Growth Potential</p>
                          <p className="text-sm text-foreground-muted">Scalability</p>
                        </div>
                      </div>
                      <span className={`text-2xl font-bold ${getScoreColor(idea.scores.growth)}`}>
                        {idea.scores.growth}%
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Improvement Checklist */}
              <Card className="p-6">
                <h2 className="text-xl font-bold text-foreground mb-6">Improve This Idea</h2>
                <div className="space-y-4">
                  {idea.checklist.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Checkbox
                        id={`checklist-${index}`}
                        checked={checkedItems.has(item)}
                        onCheckedChange={() => handleChecklistToggle(item)}
                        className="mt-1"
                      />
                      <label 
                        htmlFor={`checklist-${index}`}
                        className="text-foreground cursor-pointer flex-1"
                      >
                        {item}
                      </label>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-6 border-t border-border">
                  <Button 
                    className="btn-primary"
                    onClick={handleReEvaluate}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Re-evaluate Idea
                  </Button>
                </div>
              </Card>

              {/* Notes Section */}
              <Card className="p-6">
                <h2 className="text-xl font-bold text-foreground mb-6">Notes & Iteration</h2>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Add your thoughts, insights, or next steps..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[120px]"
                  />
                  <div className="flex gap-3">
                    <Button onClick={handleSaveNotes}>
                      <Edit className="w-4 h-4 mr-2" />
                      Save Notes
                    </Button>
                    <Button variant="outline" onClick={handleDuplicateIdea}>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate & Tweak
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card className="p-6">
                <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Idea
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={handleDuplicateIdea}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate This
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={handleReEvaluate}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Re-evaluate
                  </Button>
                </div>
              </Card>

              {/* Progress */}
              <Card className="p-6">
                <h3 className="font-semibold text-foreground mb-4">Progress</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground-muted">Checklist Completed</span>
                    <span className="font-semibold text-foreground">
                      {checkedItems.size}/{idea.checklist.length}
                    </span>
                  </div>
                  <div className="w-full bg-surface-elevated rounded-full h-2">
                    <div 
                      className="bg-brand h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${idea.checklist.length > 0 ? (checkedItems.size / idea.checklist.length) * 100 : 0}%` 
                      }}
                    />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 