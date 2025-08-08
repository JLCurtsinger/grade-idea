"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog";

import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getLetterGrade } from "@/lib/gradingScale";
import { 
  Calendar, 
  Coins, 
  TrendingUp, 
  Target, 
  DollarSign, 
  Zap,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  XCircle,
  Globe,
  Lock,
  Users,
  ChevronDown,
  Plus,
  X,
  Edit
} from "lucide-react";
import { IdeaChecklist } from "./IdeaChecklist";
import { calculateDynamicScores } from "@/lib/scoring";

interface Idea {
  id: string;
  ideaText: string;
  analysis: {
    overall_score: number;
    market_potential: number;
    competition: number;
    monetization: number;
    execution: number;
    recommendation: string; // Full paragraph recommendation
    insights: string[]; // MUST always be defined as array — frontend uses .join()
  };
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  tokensUsed: number;
  public?: boolean;
  summary_analysis?: string; // AI Analysis summary
  userArchetype?: string | {
    demographics?: string;
    behavior?: string;
    pain_points?: string;
  }; // Target user demographics and behavior - can be string or object
  risks?: string[]; // MUST always be defined as array — key risks and blind spots
  // New structured fields from backend
  similar_products?: Array<{
    name: string;
    description: string;
    url?: string;
  }>;
  monetization_models?: string[];
  gtm_channels?: string[];
  score_explanations?: {
    market_potential: string;
    competition: string;
    monetization: string;
    execution: string;
  };
  // Custom fields
  custom?: {
    go_to_market_channels?: string[];
    monetization_models?: string[];
    target_user_archetype?: string[];
    risk_mitigation_plans?: Array<{
      risk: string;
      mitigation: string;
    }>;
  };
}

interface IdeaDetailModalProps {
  idea: Idea | null;
  isOpen: boolean;
  onClose: () => void;
  onScoreUpdate?: (scores: {
    market_potential: number;
    monetization: number;
    execution: number;
    overall_score: number;
  }) => void; // Callback to refresh dashboard with specific scores
  googleTrendScore?: number; // Google Trends score from the API
}

export function IdeaDetailModal({ idea, isOpen, onClose, onScoreUpdate, googleTrendScore }: IdeaDetailModalProps) {
  const { user } = useAuth();
  const [dynamicScores, setDynamicScores] = useState<{
    market_potential: number;
    monetization: number;
    execution: number;
    overall_score: number;
    letter_grade: string;
  } | null>(null);
  const [isPublic, setIsPublic] = useState(idea?.public || false);
  const [isToggling, setIsToggling] = useState(false);
  const [isGoogleTrendsExpanded, setIsGoogleTrendsExpanded] = useState(false);
  
  // Custom channels state
  const [customChannels, setCustomChannels] = useState<string[]>(idea?.custom?.go_to_market_channels || []);
  const [newChannel, setNewChannel] = useState("");
  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [isSavingChannels, setIsSavingChannels] = useState(false);
  
  // Custom monetization models state
  const [customMonetization, setCustomMonetization] = useState<string[]>(idea?.custom?.monetization_models || []);
  const [newMonetization, setNewMonetization] = useState("");
  const [isAddingMonetization, setIsAddingMonetization] = useState(false);
  const [isSavingMonetization, setIsSavingMonetization] = useState(false);
  
  // Custom target user archetype state
  const [customArchetype, setCustomArchetype] = useState<string[]>(idea?.custom?.target_user_archetype || []);
  const [isEditingArchetype, setIsEditingArchetype] = useState(false);
  const [editingArchetypeItems, setEditingArchetypeItems] = useState<string[]>([]);
  const [isSavingArchetype, setIsSavingArchetype] = useState(false);
  
  // Risk mitigation plans state
  const [riskMitigationPlans, setRiskMitigationPlans] = useState<Array<{risk: string; mitigation: string}>>(
    idea?.custom?.risk_mitigation_plans || []
  );
  const [editingRisk, setEditingRisk] = useState<string>("");
  const [editingMitigation, setEditingMitigation] = useState<string>("");
  const [isAddingMitigation, setIsAddingMitigation] = useState(false);
  const [isSavingMitigation, setIsSavingMitigation] = useState(false);

  // Update isPublic when idea changes
  useEffect(() => {
    setIsPublic(idea?.public || false);
  }, [idea?.public]);

  // Reset dynamicScores when idea changes
  useEffect(() => {
    setDynamicScores(null);
  }, [idea?.id]);

  // Update custom channels when idea changes
  useEffect(() => {
    setCustomChannels(idea?.custom?.go_to_market_channels || []);
  }, [idea?.custom?.go_to_market_channels]);

  // Update custom monetization when idea changes
  useEffect(() => {
    setCustomMonetization(idea?.custom?.monetization_models || []);
  }, [idea?.custom?.monetization_models]);

  // Update custom archetype when idea changes
  useEffect(() => {
    setCustomArchetype(idea?.custom?.target_user_archetype || []);
  }, [idea?.custom?.target_user_archetype]);

  // Update risk mitigation plans when idea changes
  useEffect(() => {
    setRiskMitigationPlans(idea?.custom?.risk_mitigation_plans || []);
  }, [idea?.custom?.risk_mitigation_plans]);



  if (!idea) return null;

  const formatDate = (timestamp: { seconds: number; nanoseconds: number }) => {
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (score >= 60) return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case "Worth Building":
        return "text-green-600";
      case "Needs Work":
        return "text-yellow-600";
      case "Not Recommended":
        return "text-red-600";
      default:
        return "text-foreground-muted";
    }
  };

  const handlePublicToggle = async (checked: boolean) => {
    if (!user) return;
    
    setIsToggling(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/toggle-idea-public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ideaId: idea.id,
          idToken,
          public: checked
        }),
      });

      if (response.ok) {
        setIsPublic(checked);
      } else {
        console.error('Failed to toggle public status');
      }
    } catch (error) {
      console.error('Error toggling public status:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const handleScoreUpdate = async (scores: {
    market_potential: number;
    monetization: number;
    execution: number;
    overall_score: number;
    letter_grade: string;
  }) => {
    setDynamicScores(scores);
    
    // Persist updated scores to Firestore
    try {
      if (user && idea) {
        const idToken = await user.getIdToken();
        const response = await fetch('/api/update-idea-scores', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ideaId: idea.id,
            idToken,
            scores: {
              market_potential: scores.market_potential,
              monetization: scores.monetization,
              execution: scores.execution,
              overall_score: scores.overall_score,
              letter_grade: scores.letter_grade
            }
          }),
        });

        if (!response.ok) {
          console.error('Failed to persist score updates to Firestore');
        }
      }
    } catch (error) {
      console.error('Error persisting score updates:', error);
    }
    
    // Notify parent component with specific scores
    if (onScoreUpdate) {
      onScoreUpdate({
        market_potential: scores.market_potential,
        monetization: scores.monetization,
        execution: scores.execution,
        overall_score: scores.overall_score
      });
    }
  };

  // Custom channels functions
  const handleAddChannel = async () => {
    if (!newChannel.trim() || !user || !idea) return;
    
    const trimmedChannel = newChannel.trim();
    
    // Check for duplicates
    if (customChannels.includes(trimmedChannel)) {
      setNewChannel("");
      return;
    }
    
    setIsAddingChannel(true);
    try {
      const updatedChannels = [...customChannels, trimmedChannel];
      setCustomChannels(updatedChannels);
      setNewChannel("");
      
      // Save to Firestore
      const idToken = await user.getIdToken();
      const response = await fetch('/api/update-custom-channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ideaId: idea.id,
          idToken,
          customChannels: updatedChannels
        }),
      });

      if (!response.ok) {
        console.error('Failed to save custom channels');
        // Revert on error
        setCustomChannels(customChannels);
      }
    } catch (error) {
      console.error('Error saving custom channels:', error);
      // Revert on error
      setCustomChannels(customChannels);
    } finally {
      setIsAddingChannel(false);
    }
  };

  const handleRemoveChannel = async (channelToRemove: string) => {
    if (!user || !idea) return;
    
    setIsSavingChannels(true);
    try {
      const updatedChannels = customChannels.filter(channel => channel !== channelToRemove);
      setCustomChannels(updatedChannels);
      
      // Save to Firestore
      const idToken = await user.getIdToken();
      const response = await fetch('/api/update-custom-channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ideaId: idea.id,
          idToken,
          customChannels: updatedChannels
        }),
      });

      if (!response.ok) {
        console.error('Failed to save custom channels');
        // Revert on error
        setCustomChannels(customChannels);
      }
    } catch (error) {
      console.error('Error saving custom channels:', error);
      // Revert on error
      setCustomChannels(customChannels);
    } finally {
      setIsSavingChannels(false);
    }
  };

  const handleChannelKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddChannel();
    }
  };

  // Custom monetization functions
  const handleAddMonetization = async () => {
    if (!newMonetization.trim() || !user || !idea) return;
    
    const trimmedModel = newMonetization.trim();
    
    // Check for duplicates
    if (customMonetization.includes(trimmedModel)) {
      setNewMonetization("");
      return;
    }
    
    setIsAddingMonetization(true);
    try {
      const updatedMonetization = [...customMonetization, trimmedModel];
      setCustomMonetization(updatedMonetization);
      setNewMonetization("");
      
      // Save to Firestore
      const idToken = await user.getIdToken();
      const response = await fetch('/api/update-custom-monetization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ideaId: idea.id,
          idToken,
          customMonetization: updatedMonetization
        }),
      });

      if (!response.ok) {
        console.error('Failed to save custom monetization models');
        // Revert on error
        setCustomMonetization(customMonetization);
      }
    } catch (error) {
      console.error('Error saving custom monetization models:', error);
      // Revert on error
      setCustomMonetization(customMonetization);
    } finally {
      setIsAddingMonetization(false);
    }
  };

  const handleRemoveMonetization = async (modelToRemove: string) => {
    if (!user || !idea) return;
    
    setIsSavingMonetization(true);
    try {
      const updatedMonetization = customMonetization.filter(model => model !== modelToRemove);
      setCustomMonetization(updatedMonetization);
      
      // Save to Firestore
      const idToken = await user.getIdToken();
      const response = await fetch('/api/update-custom-monetization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ideaId: idea.id,
          idToken,
          customMonetization: updatedMonetization
        }),
      });

      if (!response.ok) {
        console.error('Failed to save custom monetization models');
        // Revert on error
        setCustomMonetization(customMonetization);
      }
    } catch (error) {
      console.error('Error saving custom monetization models:', error);
      // Revert on error
      setCustomMonetization(customMonetization);
    } finally {
      setIsSavingMonetization(false);
    }
  };

  const handleMonetizationKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddMonetization();
    }
  };

  // Helper function to parse text to bullet points
  const parseTextToBullets = (text: string | any): string[] => {
    if (typeof text !== 'string') return [];
    
    // Split by common bullet point indicators and clean up
    return text
      .split(/[•\-\*]/)
      .map(item => item.trim())
      .filter(item => item.length > 0);
  };

  // Custom archetype functions
  const handleEditArchetype = () => {
    if (!user || !idea) return;
    
    setIsEditingArchetype(true);
    
    // Defensive conversion to array
    let currentArchetype: string[];
    if (Array.isArray(customArchetype) && customArchetype.length > 0) {
      currentArchetype = customArchetype;
    } else if (typeof idea.userArchetype === 'string') {
      currentArchetype = parseTextToBullets(idea.userArchetype);
    } else {
      currentArchetype = [];
    }
    
    setEditingArchetypeItems(currentArchetype);
  };

  const handleSaveArchetype = async () => {
    if (!user || !idea) return;
    
    setIsSavingArchetype(true);
    try {
      // Filter out empty items
      const cleanedArchetype = editingArchetypeItems.filter(item => item.trim().length > 0);
      setCustomArchetype(cleanedArchetype);
      setIsEditingArchetype(false);
      setEditingArchetypeItems([]);
      
      // Save to Firestore
      const idToken = await user.getIdToken();
      const response = await fetch('/api/update-custom-archetype', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ideaId: idea.id,
          idToken,
          customArchetype: cleanedArchetype
        }),
      });

      if (!response.ok) {
        console.error('Failed to save custom archetype');
        // Revert on error
        setCustomArchetype(customArchetype);
      }
    } catch (error) {
      console.error('Error saving custom archetype:', error);
      // Revert on error
      setCustomArchetype(customArchetype);
    } finally {
      setIsSavingArchetype(false);
    }
  };

  const handleCancelArchetype = () => {
    setIsEditingArchetype(false);
    setEditingArchetypeItems([]);
  };

  const handleAddArchetypeItem = () => {
    setEditingArchetypeItems([...editingArchetypeItems, '']);
  };

  const handleUpdateArchetypeItem = (index: number, value: string) => {
    const updatedItems = [...editingArchetypeItems];
    updatedItems[index] = value;
    setEditingArchetypeItems(updatedItems);
  };

  const handleDeleteArchetypeItem = (index: number) => {
    const updatedItems = editingArchetypeItems.filter((_, i) => i !== index);
    setEditingArchetypeItems(updatedItems);
  };

  // Risk mitigation functions
  const handleAddMitigation = (risk: string) => {
    if (!user || !idea) return;
    
    setEditingRisk(risk);
    setEditingMitigation("");
    setIsAddingMitigation(true);
  };

  const handleEditMitigation = (risk: string, currentMitigation: string) => {
    if (!user || !idea) return;
    
    setEditingRisk(risk);
    setEditingMitigation(currentMitigation);
    setIsAddingMitigation(true);
  };

  const handleSaveMitigation = async () => {
    if (!user || !idea || !editingRisk.trim() || !editingMitigation.trim()) return;
    
    setIsSavingMitigation(true);
    try {
      const trimmedRisk = editingRisk.trim();
      const trimmedMitigation = editingMitigation.trim();
      
      // Find existing mitigation for this risk or create new one
      const existingIndex = riskMitigationPlans.findIndex(plan => plan.risk === trimmedRisk);
      let updatedPlans = [...riskMitigationPlans];
      
      if (existingIndex >= 0) {
        // Update existing mitigation
        updatedPlans[existingIndex] = { risk: trimmedRisk, mitigation: trimmedMitigation };
      } else {
        // Add new mitigation
        updatedPlans.push({ risk: trimmedRisk, mitigation: trimmedMitigation });
      }
      
      setRiskMitigationPlans(updatedPlans);
      setIsAddingMitigation(false);
      setEditingRisk("");
      setEditingMitigation("");
      
      // Save to Firestore
      const idToken = await user.getIdToken();
      const response = await fetch('/api/update-risk-mitigation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ideaId: idea.id,
          idToken,
          riskMitigationPlans: updatedPlans
        }),
      });

      if (!response.ok) {
        console.error('Failed to save risk mitigation plans');
        // Revert on error
        setRiskMitigationPlans(riskMitigationPlans);
      }
    } catch (error) {
      console.error('Error saving risk mitigation plans:', error);
      // Revert on error
      setRiskMitigationPlans(riskMitigationPlans);
    } finally {
      setIsSavingMitigation(false);
    }
  };

  const handleDeleteMitigation = async (riskToDelete: string) => {
    if (!user || !idea) return;
    
    setIsSavingMitigation(true);
    try {
      const updatedPlans = riskMitigationPlans.filter(plan => plan.risk !== riskToDelete);
      setRiskMitigationPlans(updatedPlans);
      
      // Save to Firestore
      const idToken = await user.getIdToken();
      const response = await fetch('/api/update-risk-mitigation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ideaId: idea.id,
          idToken,
          riskMitigationPlans: updatedPlans
        }),
      });

      if (!response.ok) {
        console.error('Failed to save risk mitigation plans');
        // Revert on error
        setRiskMitigationPlans(riskMitigationPlans);
      }
    } catch (error) {
      console.error('Error saving risk mitigation plans:', error);
      // Revert on error
      setRiskMitigationPlans(riskMitigationPlans);
    } finally {
      setIsSavingMitigation(false);
    }
  };

  const handleCancelMitigation = () => {
    setIsAddingMitigation(false);
    setEditingRisk("");
    setEditingMitigation("");
  };

  const getMitigationForRisk = (risk: string) => {
    return riskMitigationPlans.find(plan => plan.risk === risk)?.mitigation || null;
  };

  // Get base score from idea data
  const baseScore = (idea as any)?.baseScore || idea.analysis.overall_score;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            Idea Analysis Details
          </DialogTitle>
          <DialogDescription className="text-foreground-muted">
            Detailed breakdown of your idea evaluation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Idea Text */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Your Idea</h3>
            <Card className="p-4 bg-surface">
              <p className="text-foreground leading-relaxed">{idea.ideaText}</p>
            </Card>
          </div>

          {/* AI Analysis */}
          {idea.summary_analysis && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">AI Analysis</h3>
              <Card className="p-4 bg-surface">
                <p className="text-foreground-muted leading-relaxed">{idea.summary_analysis}</p>
              </Card>
            </div>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap gap-4 text-sm text-foreground-muted">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {formatDate(idea.createdAt)}
            </div>
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4" />
              {idea.tokensUsed} token{idea.tokensUsed !== 1 ? 's' : ''} used
            </div>
          </div>

          {/* Public Toggle */}
          {user && (
            <div className="flex items-center justify-between p-3 bg-surface-elevated rounded-lg border border-border">
              <div className="flex items-center gap-3">
                {isPublic ? (
                  <Globe className="w-4 h-4 text-brand" />
                ) : (
                  <Lock className="w-4 h-4 text-foreground-muted" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Make this idea public?
                  </p>
                  <p className="text-xs text-foreground-muted">
                    {isPublic ? 'This idea is visible to other users' : 'This idea is private'}
                  </p>
                </div>
              </div>
              <Switch
                checked={isPublic}
                onCheckedChange={handlePublicToggle}
                disabled={isToggling}
              />
            </div>
          )}

          {/* Overall Recommendation */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Recommendation</h3>
            <div className="space-y-3">
              <p className={`text-lg font-medium ${getRecommendationColor(idea.analysis.recommendation)}`}>
                {idea.analysis.recommendation}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground-muted">Overall Score:</span>
                <span className={`text-lg font-bold transition-all duration-300 ${
                  dynamicScores ? getScoreColor(dynamicScores.overall_score) : getScoreColor(idea.analysis.overall_score)
                }`}>
                  {dynamicScores ? dynamicScores.overall_score : idea.analysis.overall_score}%
                </span>
                {(() => {
                  if (dynamicScores) {
                    // Use the letter_grade from dynamicScores
                    const { letter, color } = getLetterGrade(dynamicScores.overall_score);
                    return (
                      <span className={`text-lg font-bold transition-all duration-300 ${
                        color === 'green' ? 'text-green-600' :
                        color === 'lime' ? 'text-lime-600' :
                        color === 'yellow' ? 'text-yellow-600' :
                        color === 'orange' ? 'text-orange-600' :
                        color === 'red' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {letter}
                      </span>
                    );
                  } else {
                    // Use original idea analysis for letter grade
                    const { letter, color } = getLetterGrade(idea.analysis.overall_score);
                    return (
                      <span className={`text-lg font-bold transition-all duration-300 ${
                        color === 'green' ? 'text-green-600' :
                        color === 'lime' ? 'text-lime-600' :
                        color === 'yellow' ? 'text-yellow-600' :
                        color === 'orange' ? 'text-orange-600' :
                        color === 'red' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {letter}
                      </span>
                    );
                  }
                })()}
                {/* Show base score indicator if different from current score */}
                {dynamicScores && dynamicScores.overall_score > baseScore && (
                  <span className="text-xs text-green-600 font-medium">
                    ↑ from {baseScore}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Score Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium text-foreground">Market Potential</h4>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold transition-all duration-300 ${
                    dynamicScores ? getScoreColor(dynamicScores.market_potential) : getScoreColor(idea.analysis.market_potential)
                  }`}>
                    {dynamicScores ? dynamicScores.market_potential : idea.analysis.market_potential}%
                  </span>
                  {getScoreIcon(dynamicScores ? dynamicScores.market_potential : idea.analysis.market_potential)}
                </div>
                <div className="mt-2 h-2 bg-surface-elevated rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      (dynamicScores ? dynamicScores.market_potential : idea.analysis.market_potential) >= 80 ? 'bg-green-500' :
                      (dynamicScores ? dynamicScores.market_potential : idea.analysis.market_potential) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${dynamicScores ? dynamicScores.market_potential : idea.analysis.market_potential}%` }}
                  />
                </div>
                {idea.score_explanations?.market_potential && (
                  <p className="text-xs text-foreground-muted mt-2 leading-relaxed">
                    {idea.score_explanations.market_potential}
                  </p>
                )}
                
                {/* Google Trends Score Section */}
                <div className="mt-3 pt-3 border-t border-border">
                  <button
                    onClick={() => setIsGoogleTrendsExpanded(!isGoogleTrendsExpanded)}
                    className="flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground transition-colors"
                  >
                    <span>Google Trends Score: {googleTrendScore || 72}</span>
                    <ChevronDown 
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isGoogleTrendsExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  
                  <div 
                    className={`overflow-hidden transition-all duration-200 ease-in-out ${
                      isGoogleTrendsExpanded ? 'max-h-20 opacity-100 mt-2' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <p className="text-xs text-foreground-muted leading-relaxed">
                      This score reflects how often related keywords have been searched in the past 30 days. A higher number indicates increasing public interest.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Target className="w-5 h-5 text-purple-600" />
                  <h4 className="font-medium text-foreground">Competition</h4>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold transition-all duration-300 ${
                    dynamicScores ? getScoreColor(dynamicScores.market_potential) : getScoreColor(idea.analysis.competition)
                  }`}>
                    {dynamicScores ? dynamicScores.market_potential : idea.analysis.competition}%
                  </span>
                  {getScoreIcon(dynamicScores ? dynamicScores.market_potential : idea.analysis.competition)}
                </div>
                <div className="mt-2 h-2 bg-surface-elevated rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      (dynamicScores ? dynamicScores.market_potential : idea.analysis.competition) >= 80 ? 'bg-green-500' :
                      (dynamicScores ? dynamicScores.market_potential : idea.analysis.competition) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${dynamicScores ? dynamicScores.market_potential : idea.analysis.competition}%` }}
                  />
                </div>
                {idea.score_explanations?.competition && (
                  <p className="text-xs text-foreground-muted mt-2 leading-relaxed">
                    {idea.score_explanations.competition}
                  </p>
                )}
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium text-foreground">Monetization</h4>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold transition-all duration-300 ${
                    dynamicScores ? getScoreColor(dynamicScores.monetization) : getScoreColor(idea.analysis.monetization)
                  }`}>
                    {dynamicScores ? dynamicScores.monetization : idea.analysis.monetization}%
                  </span>
                  {getScoreIcon(dynamicScores ? dynamicScores.monetization : idea.analysis.monetization)}
                </div>
                <div className="mt-2 h-2 bg-surface-elevated rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      (dynamicScores ? dynamicScores.monetization : idea.analysis.monetization) >= 80 ? 'bg-green-500' :
                      (dynamicScores ? dynamicScores.monetization : idea.analysis.monetization) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${dynamicScores ? dynamicScores.monetization : idea.analysis.monetization}%` }}
                  />
                </div>
                {idea.score_explanations?.monetization && (
                  <p className="text-xs text-foreground-muted mt-2 leading-relaxed">
                    {idea.score_explanations.monetization}
                  </p>
                )}
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Zap className="w-5 h-5 text-orange-600" />
                  <h4 className="font-medium text-foreground">Execution</h4>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold transition-all duration-300 ${
                    dynamicScores ? getScoreColor(dynamicScores.execution) : getScoreColor(idea.analysis.execution)
                  }`}>
                    {dynamicScores ? dynamicScores.execution : idea.analysis.execution}%
                  </span>
                  {getScoreIcon(dynamicScores ? dynamicScores.execution : idea.analysis.execution)}
                </div>
                <div className="mt-2 h-2 bg-surface-elevated rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      (dynamicScores ? dynamicScores.execution : idea.analysis.execution) >= 80 ? 'bg-green-500' :
                      (dynamicScores ? dynamicScores.execution : idea.analysis.execution) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${dynamicScores ? dynamicScores.execution : idea.analysis.execution}%` }}
                  />
                </div>
                {idea.score_explanations?.execution && (
                  <p className="text-xs text-foreground-muted mt-2 leading-relaxed">
                    {idea.score_explanations.execution}
                  </p>
                )}
              </Card>
            </div>
          </div>

          {/* Key Insights */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-brand" />
              <h3 className="text-lg font-semibold text-foreground">Key Insights</h3>
            </div>
            <Card className="p-4">
              <ul className="space-y-3">
                {idea.analysis.insights.map((insight, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-brand rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-foreground leading-relaxed">{insight}</p>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Risks */}
          {idea.risks && idea.risks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-foreground">Key Risks & Blind Spots</h3>
              </div>
              <Card className="p-4">
                <ul className="space-y-4">
                  {idea.risks.map((risk, index) => {
                    const riskText = typeof risk === 'string' ? risk : JSON.stringify(risk);
                    const existingMitigation = getMitigationForRisk(riskText);
                    
                    return (
                      <li key={index} className="space-y-2">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div className="flex-1">
                            <p className="text-foreground leading-relaxed">
                              {riskText}
                            </p>
                            
                            {/* Existing mitigation display */}
                            {existingMitigation && !isAddingMitigation && (
                              <div className="mt-3 p-3 bg-brand/5 border border-brand/20 rounded-lg">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-brand mb-1">Your Mitigation Plan:</p>
                                    <p className="text-sm text-foreground leading-relaxed">{existingMitigation}</p>
                                  </div>
                                  {user && (
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => handleEditMitigation(riskText, existingMitigation)}
                                        disabled={isSavingMitigation}
                                        className="p-1 text-foreground-muted hover:text-brand transition-colors"
                                        title="Edit mitigation"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteMitigation(riskText)}
                                        disabled={isSavingMitigation}
                                        className="p-1 text-foreground-muted hover:text-red-500 transition-colors"
                                        title="Delete mitigation"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Add mitigation button */}
                            {user && !existingMitigation && !isAddingMitigation && (
                              <button
                                onClick={() => handleAddMitigation(riskText)}
                                disabled={isSavingMitigation}
                                className="mt-2 text-sm text-brand hover:text-brand/80 transition-colors flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                Add Mitigation Plan
                              </button>
                            )}
                            
                            {/* Mitigation input form */}
                            {isAddingMitigation && editingRisk === riskText && (
                              <div className="mt-3 space-y-3">
                                <textarea
                                  value={editingMitigation}
                                  onChange={(e) => setEditingMitigation(e.target.value)}
                                  placeholder="Describe your mitigation plan (1-3 sentences)..."
                                  className="w-full min-h-[80px] p-3 border border-border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                                  disabled={isSavingMitigation}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    onClick={handleSaveMitigation}
                                    disabled={!editingMitigation.trim() || isSavingMitigation}
                                    size="sm"
                                    className="btn-primary"
                                  >
                                    {isSavingMitigation ? (
                                      <div className="w-4 h-4 border-2 border-brand-foreground/30 border-t-brand-foreground rounded-full animate-spin" />
                                    ) : (
                                      'Save'
                                    )}
                                  </Button>
                                  <Button
                                    onClick={handleCancelMitigation}
                                    disabled={isSavingMitigation}
                                    variant="outline"
                                    size="sm"
                                    className="btn-secondary"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </div>
          )}

          {/* User Archetype */}
          {idea.userArchetype && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-foreground">Target User Archetype</h3>
                </div>
                {user && (
                  <Button
                    onClick={handleEditArchetype}
                    disabled={isEditingArchetype || isSavingArchetype}
                    variant="outline"
                    size="sm"
                    className="btn-secondary"
                  >
                    Edit
                  </Button>
                )}
              </div>
              <Card className="p-4">
                {isEditingArchetype ? (
                  <div className="space-y-3">
                    {/* Bullet list editor */}
                    <div className="space-y-2">
                      {editingArchetypeItems.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-brand rounded-full flex-shrink-0"></div>
                          <Input
                            value={item}
                            onChange={(e) => handleUpdateArchetypeItem(index, e.target.value)}
                            placeholder="Enter archetype detail..."
                            className="flex-1"
                            disabled={isSavingArchetype}
                          />
                          <button
                            onClick={() => handleDeleteArchetypeItem(index)}
                            disabled={isSavingArchetype}
                            className="p-1 text-foreground-muted hover:text-red-500 transition-colors"
                            title="Delete item"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      
                      {/* Add new item button */}
                      <button
                        onClick={handleAddArchetypeItem}
                        disabled={isSavingArchetype}
                        className="flex items-center gap-2 text-sm text-brand hover:text-brand/80 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Item
                      </button>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveArchetype}
                        disabled={editingArchetypeItems.length === 0 || isSavingArchetype}
                        size="sm"
                        className="btn-primary"
                      >
                        {isSavingArchetype ? (
                          <div className="w-4 h-4 border-2 border-brand-foreground/30 border-t-brand-foreground rounded-full animate-spin" />
                        ) : (
                          'Save'
                        )}
                      </Button>
                      <Button
                        onClick={handleCancelArchetype}
                        disabled={isSavingArchetype}
                        variant="outline"
                        size="sm"
                        className="btn-secondary"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {customArchetype && customArchetype.length > 0 ? (
                      <div>
                        <ul className="space-y-2">
                          {customArchetype.map((item, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <div className="w-2 h-2 bg-brand rounded-full mt-2 flex-shrink-0"></div>
                              <p className="text-foreground leading-relaxed">{item}</p>
                            </li>
                          ))}
                        </ul>
                        {user && (
                          <p className="text-xs text-foreground-muted mt-2">
                            Custom version - click Edit to modify
                          </p>
                        )}
                      </div>
                    ) : typeof idea.userArchetype === 'string' ? (
                      <div>
                        <ul className="space-y-2">
                          {parseTextToBullets(idea.userArchetype).map((item, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                              <p className="text-foreground leading-relaxed">{item}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {idea.userArchetype.demographics && (
                          <div>
                            <h4 className="font-medium text-foreground mb-1">Demographics</h4>
                            <p className="text-foreground-muted leading-relaxed">{idea.userArchetype.demographics}</p>
                          </div>
                        )}
                        {idea.userArchetype.behavior && (
                          <div>
                            <h4 className="font-medium text-foreground mb-1">Behavior</h4>
                            <p className="text-foreground-muted leading-relaxed">{idea.userArchetype.behavior}</p>
                          </div>
                        )}
                        {idea.userArchetype.pain_points && (
                          <div>
                            <h4 className="font-medium text-foreground mb-1">Pain Points</h4>
                            <p className="text-foreground-muted leading-relaxed">{idea.userArchetype.pain_points}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Similar Products */}
          {idea.similar_products && idea.similar_products.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">Similar Products</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {idea.similar_products.map((product, index) => (
                  <Card key={index} className="p-4 hover:border-brand/30 transition-colors">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{product.name}</h4>
                          <p className="text-sm text-foreground-muted mt-1">{product.description}</p>
                        </div>
                        {product.url && (
                          <a
                            href={product.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0"
                          >
                            <Globe className="w-4 h-4 text-foreground-muted hover:text-brand transition-colors" />
                          </a>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Strategy Section */}
          {(idea.monetization_models || idea.gtm_channels) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Strategy</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Monetization Models */}
                <Card className="p-4">
                  <h4 className="font-medium text-foreground mb-3">Monetization Models</h4>
                  
                  {/* AI-generated models */}
                  {idea.monetization_models && idea.monetization_models.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {idea.monetization_models.map((model, index) => (
                          <Badge key={index} variant="secondary" className="bg-brand/10 text-brand border-brand/20">
                            {model}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Custom models - only show for authenticated users */}
                  {user && (
                    <div className="space-y-3">
                      {/* Custom models display */}
                      {customMonetization.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-foreground">Your Models:</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {customMonetization.map((model, index) => (
                              <Badge 
                                key={index} 
                                variant="secondary" 
                                className="bg-brand/10 text-brand border-brand/20 group"
                              >
                                <span className="mr-1">{model}</span>
                                <button
                                  onClick={() => handleRemoveMonetization(model)}
                                  disabled={isSavingMonetization}
                                  className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Add new model input */}
                      <div className="flex gap-2">
                        <Input
                          value={newMonetization}
                          onChange={(e) => setNewMonetization(e.target.value)}
                          onKeyPress={handleMonetizationKeyPress}
                          placeholder="Add a custom model..."
                          className="flex-1"
                          disabled={isAddingMonetization || isSavingMonetization}
                        />
                        <Button
                          onClick={handleAddMonetization}
                          disabled={!newMonetization.trim() || isAddingMonetization || isSavingMonetization}
                          size="sm"
                          className="btn-primary"
                        >
                          {isAddingMonetization ? (
                            <div className="w-4 h-4 border-2 border-brand-foreground/30 border-t-brand-foreground rounded-full animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>

                {/* GTM Channels */}
                <Card className="p-4">
                  <h4 className="font-medium text-foreground mb-3">Go-To-Market Channels</h4>
                  
                  {/* AI-generated channels */}
                  {idea.gtm_channels && idea.gtm_channels.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {idea.gtm_channels.map((channel, index) => (
                          <Badge key={index} variant="secondary" className="bg-surface-elevated">
                            {channel}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Custom channels - only show for authenticated users */}
                  {user && (
                    <div className="space-y-3">
                      {/* Custom channels display */}
                      {customChannels.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-foreground">Your Channels:</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {customChannels.map((channel, index) => (
                              <Badge 
                                key={index} 
                                variant="secondary" 
                                className="bg-brand/10 text-brand border-brand/20 group"
                              >
                                <span className="mr-1">{channel}</span>
                                <button
                                  onClick={() => handleRemoveChannel(channel)}
                                  disabled={isSavingChannels}
                                  className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Add new channel input */}
                      <div className="flex gap-2">
                        <Input
                          value={newChannel}
                          onChange={(e) => setNewChannel(e.target.value)}
                          onKeyPress={handleChannelKeyPress}
                          placeholder="Add a custom channel..."
                          className="flex-1"
                          disabled={isAddingChannel || isSavingChannels}
                        />
                        <Button
                          onClick={handleAddChannel}
                          disabled={!newChannel.trim() || isAddingChannel || isSavingChannels}
                          size="sm"
                          className="btn-primary"
                        >
                          {isAddingChannel ? (
                            <div className="w-4 h-4 border-2 border-brand-foreground/30 border-t-brand-foreground rounded-full animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}

          {/* Action Items Checklist */}
          <div className="space-y-3">
            <IdeaChecklist ideaId={idea.id} ideaText={idea.ideaText} baseScore={baseScore} onScoreUpdate={handleScoreUpdate} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 