"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTokenBalance } from "@/hooks/use-token-balance";
import { useToast } from "@/hooks/use-toast";
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
  RefreshCw
} from "lucide-react";
import { IdeaChecklist } from "./IdeaChecklist";
import { calculateDynamicScores } from "@/lib/scoring";
import { RegradeConfirmationModal } from "./RegradeConfirmationModal";

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
  // Regrade fields (optional)
  ai_action_items?: Array<{
    category: string;
    items: string[];
  }>;
  ai_key_insights?: string[];
  ai_key_risks?: string[];
  last_regraded_at?: {
    seconds: number;
    nanoseconds: number;
  };
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
  const [customArchetype, setCustomArchetype] = useState<string>(idea?.custom?.target_user_archetype || "");
  const [isEditingArchetype, setIsEditingArchetype] = useState(false);
  const [editingArchetype, setEditingArchetype] = useState("");
  const [isSavingArchetype, setIsSavingArchetype] = useState(false);
  
  // Custom risk mitigation plans state - with crash prevention
  const [riskMitigations, setRiskMitigations] = useState<Array<{ risk: string; mitigation: string }>>(
    Array.isArray(idea?.custom?.risk_mitigation_plans) ? idea.custom.risk_mitigation_plans : []
  );
  const [editingMitigation, setEditingMitigation] = useState("");
  const [editingRiskIndex, setEditingRiskIndex] = useState<number | null>(null);
  const [isSavingMitigation, setIsSavingMitigation] = useState(false);
  
  // Custom target user archetypes state - with crash prevention
  const [customArchetypes, setCustomArchetypes] = useState<string[]>(
    Array.isArray(idea?.custom?.target_user_archetypes) ? idea.custom.target_user_archetypes : []
  );
  const [newArchetype, setNewArchetype] = useState("");
  const [editingArchetypeIndex, setEditingArchetypeIndex] = useState<number | null>(null);
  const [editingArchetypeText, setEditingArchetypeText] = useState("");
  const [isAddingArchetype, setIsAddingArchetype] = useState(false);
  const [isSavingArchetypes, setIsSavingArchetypes] = useState(false);
  
  // Custom key insights state - with crash prevention
  const [customKeyInsights, setCustomKeyInsights] = useState<string[]>(
    Array.isArray(idea?.custom?.key_insights) ? idea.custom.key_insights : []
  );
  const [newKeyInsight, setNewKeyInsight] = useState("");
  const [editingKeyInsightIndex, setEditingKeyInsightIndex] = useState<number | null>(null);
  const [editingKeyInsightText, setEditingKeyInsightText] = useState("");
  const [isAddingKeyInsight, setIsAddingKeyInsight] = useState(false);
  const [isSavingKeyInsights, setIsSavingKeyInsights] = useState(false);
  
  // Custom notes state - with crash prevention
  const [customNotes, setCustomNotes] = useState<Record<string, string>>(
    typeof idea?.custom?.notes === 'object' && idea.custom.notes !== null ? idea.custom.notes : {}
  );
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Regrade functionality state
  const { tokenBalance } = useTokenBalance();
  const { toast } = useToast();
  const [isRegradeModalOpen, setIsRegradeModalOpen] = useState(false);
  const [isRegrading, setIsRegrading] = useState(false);

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
    setCustomArchetype(idea?.custom?.target_user_archetype || "");
  }, [idea?.custom?.target_user_archetype]);

  // Update risk mitigations when idea changes - with crash prevention
  useEffect(() => {
    const customMitigations = idea?.custom?.risk_mitigation_plans;
    if (Array.isArray(customMitigations)) {
      setRiskMitigations(customMitigations);
    } else {
      setRiskMitigations([]);
    }
  }, [idea?.custom?.risk_mitigation_plans]);

  // Update custom archetypes when idea changes - with crash prevention
  useEffect(() => {
    const customArchetypesData = idea?.custom?.target_user_archetypes;
    if (Array.isArray(customArchetypesData)) {
      setCustomArchetypes(customArchetypesData);
    } else {
      setCustomArchetypes([]);
    }
  }, [idea?.custom?.target_user_archetypes]);

  // Update custom key insights when idea changes - with crash prevention
  useEffect(() => {
    const customKeyInsightsData = idea?.custom?.key_insights;
    if (Array.isArray(customKeyInsightsData)) {
      setCustomKeyInsights(customKeyInsightsData);
    } else {
      setCustomKeyInsights([]);
    }
  }, [idea?.custom?.key_insights]);

  // Update custom notes when idea changes - with crash prevention
  useEffect(() => {
    const customNotesData = idea?.custom?.notes;
    if (typeof customNotesData === 'object' && customNotesData !== null) {
      setCustomNotes(customNotesData);
    } else {
      setCustomNotes({});
    }
  }, [idea?.custom?.notes]);



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

  // Custom archetype functions
  const handleEditArchetype = () => {
    if (!user || !idea) return;
    
    setIsEditingArchetype(true);
    // Set the current archetype (custom or AI-generated) as the starting value
    const currentArchetype = customArchetype || (typeof idea.userArchetype === 'string' ? idea.userArchetype : '');
    setEditingArchetype(currentArchetype);
  };

  const handleSaveArchetype = async () => {
    if (!user || !idea || !editingArchetype.trim()) return;
    
    setIsSavingArchetype(true);
    try {
      const trimmedArchetype = editingArchetype.trim();
      setCustomArchetype(trimmedArchetype);
      setIsEditingArchetype(false);
      setEditingArchetype("");
      
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
          customArchetype: trimmedArchetype
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
    setEditingArchetype("");
  };

  const handleArchetypeKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveArchetype();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelArchetype();
    }
  };

  // Risk mitigation functions - with crash prevention
  const handleAddMitigation = (riskIndex: number, riskText: string) => {
    if (!user || !idea) return;
    
    setEditingRiskIndex(riskIndex);
    // Check if mitigation already exists for this risk
    const existingMitigation = riskMitigations.find(m => m.risk === riskText);
    setEditingMitigation(existingMitigation?.mitigation || "");
  };

  const handleSaveMitigation = async () => {
    if (!user || !idea || editingRiskIndex === null || !editingMitigation.trim()) return;
    
    setIsSavingMitigation(true);
    try {
      const riskText = idea.risks?.[editingRiskIndex] || "";
      const newMitigation = editingMitigation.trim();
      
      // Create updated mitigations array
      const updatedMitigations = [...riskMitigations];
      const existingIndex = updatedMitigations.findIndex(m => m.risk === riskText);
      
      if (existingIndex >= 0) {
        // Update existing mitigation
        updatedMitigations[existingIndex] = { risk: riskText, mitigation: newMitigation };
      } else {
        // Add new mitigation
        updatedMitigations.push({ risk: riskText, mitigation: newMitigation });
      }
      
      setRiskMitigations(updatedMitigations);
      setEditingRiskIndex(null);
      setEditingMitigation("");
      
      // Save to Firestore
      const idToken = await user.getIdToken();
      const response = await fetch('/api/update-custom-risk-mitigations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ideaId: idea.id,
          idToken,
          riskMitigations: updatedMitigations
        }),
      });

      if (!response.ok) {
        console.error('Failed to save risk mitigation plans');
        // Revert on error
        setRiskMitigations(riskMitigations);
      }
    } catch (error) {
      console.error('Error saving risk mitigation plans:', error);
      // Revert on error
      setRiskMitigations(riskMitigations);
    } finally {
      setIsSavingMitigation(false);
    }
  };

  const handleDeleteMitigation = async (riskText: string) => {
    if (!user || !idea) return;
    
    setIsSavingMitigation(true);
    try {
      const updatedMitigations = riskMitigations.filter(m => m.risk !== riskText);
      setRiskMitigations(updatedMitigations);
      
      // Save to Firestore
      const idToken = await user.getIdToken();
      const response = await fetch('/api/update-custom-risk-mitigations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ideaId: idea.id,
          idToken,
          riskMitigations: updatedMitigations
        }),
      });

      if (!response.ok) {
        console.error('Failed to save risk mitigation plans');
        // Revert on error
        setRiskMitigations(riskMitigations);
      }
    } catch (error) {
      console.error('Error saving risk mitigation plans:', error);
      // Revert on error
      setRiskMitigations(riskMitigations);
    } finally {
      setIsSavingMitigation(false);
    }
  };

  const handleCancelMitigation = () => {
    setEditingRiskIndex(null);
    setEditingMitigation("");
  };

  const handleMitigationKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveMitigation();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelMitigation();
    }
  };

  // Helper function to get mitigation for a specific risk
  const getMitigationForRisk = (riskText: string): string | null => {
    const mitigation = riskMitigations.find(m => m.risk === riskText);
    return mitigation?.mitigation || null;
  };

  // Custom archetypes list functions - with crash prevention
  const handleAddArchetypeToList = () => {
    if (!user || !idea) return;
    
    setIsAddingArchetype(true);
    setNewArchetype("");
  };

  const handleSaveArchetypeToList = async () => {
    if (!user || !idea || !newArchetype.trim()) return;
    
    setIsSavingArchetypes(true);
    try {
      const trimmedArchetype = newArchetype.trim();
      
      // Check for duplicates
      if (customArchetypes.includes(trimmedArchetype)) {
        setNewArchetype("");
        setIsAddingArchetype(false);
        setIsSavingArchetypes(false);
        return;
      }
      
      const updatedArchetypes = [...customArchetypes, trimmedArchetype];
      setCustomArchetypes(updatedArchetypes);
      setNewArchetype("");
      setIsAddingArchetype(false);
      
      // Save to Firestore
      const idToken = await user.getIdToken();
      const response = await fetch('/api/update-custom-archetypes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ideaId: idea.id,
          idToken,
          customArchetypes: updatedArchetypes
        }),
      });

      if (!response.ok) {
        console.error('Failed to save custom archetypes');
        // Revert on error
        setCustomArchetypes(customArchetypes);
      }
    } catch (error) {
      console.error('Error saving custom archetypes:', error);
      // Revert on error
      setCustomArchetypes(customArchetypes);
    } finally {
      setIsSavingArchetypes(false);
    }
  };

  const handleEditArchetypeInList = (index: number) => {
    if (!user || !idea) return;
    
    setEditingArchetypeIndex(index);
    setEditingArchetypeText(customArchetypes[index] || "");
  };

  const handleSaveEditedArchetypeInList = async () => {
    if (!user || !idea || editingArchetypeIndex === null || !editingArchetypeText.trim()) return;
    
    setIsSavingArchetypes(true);
    try {
      const trimmedArchetype = editingArchetypeText.trim();
      
      // Check for duplicates (excluding current index)
      const isDuplicate = customArchetypes.some((archetype, idx) => 
        idx !== editingArchetypeIndex && archetype === trimmedArchetype
      );
      
      if (isDuplicate) {
        setEditingArchetypeIndex(null);
        setEditingArchetypeText("");
        setIsSavingArchetypes(false);
        return;
      }
      
      const updatedArchetypes = [...customArchetypes];
      updatedArchetypes[editingArchetypeIndex] = trimmedArchetype;
      setCustomArchetypes(updatedArchetypes);
      setEditingArchetypeIndex(null);
      setEditingArchetypeText("");
      
      // Save to Firestore
      const idToken = await user.getIdToken();
      const response = await fetch('/api/update-custom-archetypes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ideaId: idea.id,
          idToken,
          customArchetypes: updatedArchetypes
        }),
      });

      if (!response.ok) {
        console.error('Failed to save custom archetypes');
        // Revert on error
        setCustomArchetypes(customArchetypes);
      }
    } catch (error) {
      console.error('Error saving custom archetypes:', error);
      // Revert on error
      setCustomArchetypes(customArchetypes);
    } finally {
      setIsSavingArchetypes(false);
    }
  };

  const handleDeleteArchetypeFromList = async (index: number) => {
    if (!user || !idea) return;
    
    setIsSavingArchetypes(true);
    try {
      const updatedArchetypes = customArchetypes.filter((_, idx) => idx !== index);
      setCustomArchetypes(updatedArchetypes);
      
      // Save to Firestore
      const idToken = await user.getIdToken();
      const response = await fetch('/api/update-custom-archetypes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ideaId: idea.id,
          idToken,
          customArchetypes: updatedArchetypes
        }),
      });

      if (!response.ok) {
        console.error('Failed to save custom archetypes');
        // Revert on error
        setCustomArchetypes(customArchetypes);
      }
    } catch (error) {
      console.error('Error saving custom archetypes:', error);
      // Revert on error
      setCustomArchetypes(customArchetypes);
    } finally {
      setIsSavingArchetypes(false);
    }
  };

  const handleCancelArchetypeList = () => {
    setIsAddingArchetype(false);
    setNewArchetype("");
    setEditingArchetypeIndex(null);
    setEditingArchetypeText("");
  };

  const handleArchetypeListKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (editingArchetypeIndex !== null) {
        handleSaveEditedArchetypeInList();
      } else {
        handleSaveArchetypeToList();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelArchetypeList();
    }
  };

  // Custom key insights functions - with crash prevention
  const handleAddKeyInsight = () => {
    if (!user || !idea) return;
    
    setIsAddingKeyInsight(true);
    setNewKeyInsight("");
  };

  const handleSaveKeyInsight = async () => {
    if (!user || !idea || !newKeyInsight.trim()) return;
    
    setIsSavingKeyInsights(true);
    try {
      const trimmedInsight = newKeyInsight.trim();
      
      // Check for duplicates
      if (customKeyInsights.includes(trimmedInsight)) {
        setNewKeyInsight("");
        setIsAddingKeyInsight(false);
        setIsSavingKeyInsights(false);
        return;
      }
      
      const updatedKeyInsights = [...customKeyInsights, trimmedInsight];
      setCustomKeyInsights(updatedKeyInsights);
      setNewKeyInsight("");
      setIsAddingKeyInsight(false);
      
      // Save to Firestore
      const idToken = await user.getIdToken();
      const response = await fetch('/api/update-custom-key-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ideaId: idea.id,
          idToken,
          customKeyInsights: updatedKeyInsights
        }),
      });

      if (!response.ok) {
        console.error('Failed to save custom key insights');
        // Revert on error
        setCustomKeyInsights(customKeyInsights);
      }
    } catch (error) {
      console.error('Error saving custom key insights:', error);
      // Revert on error
      setCustomKeyInsights(customKeyInsights);
    } finally {
      setIsSavingKeyInsights(false);
    }
  };

  const handleEditKeyInsight = (index: number) => {
    if (!user || !idea) return;
    
    setEditingKeyInsightIndex(index);
    setEditingKeyInsightText(customKeyInsights[index] || "");
  };

  const handleSaveEditedKeyInsight = async () => {
    if (!user || !idea || editingKeyInsightIndex === null || !editingKeyInsightText.trim()) return;
    
    setIsSavingKeyInsights(true);
    try {
      const trimmedInsight = editingKeyInsightText.trim();
      
      // Check for duplicates (excluding current index)
      const isDuplicate = customKeyInsights.some((insight, idx) => 
        idx !== editingKeyInsightIndex && insight === trimmedInsight
      );
      
      if (isDuplicate) {
        setEditingKeyInsightIndex(null);
        setEditingKeyInsightText("");
        setIsSavingKeyInsights(false);
        return;
      }
      
      const updatedKeyInsights = [...customKeyInsights];
      updatedKeyInsights[editingKeyInsightIndex] = trimmedInsight;
      setCustomKeyInsights(updatedKeyInsights);
      setEditingKeyInsightIndex(null);
      setEditingKeyInsightText("");
      
      // Save to Firestore
      const idToken = await user.getIdToken();
      const response = await fetch('/api/update-custom-key-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ideaId: idea.id,
          idToken,
          customKeyInsights: updatedKeyInsights
        }),
      });

      if (!response.ok) {
        console.error('Failed to save custom key insights');
        // Revert on error
        setCustomKeyInsights(customKeyInsights);
      }
    } catch (error) {
      console.error('Error saving custom key insights:', error);
      // Revert on error
      setCustomKeyInsights(customKeyInsights);
    } finally {
      setIsSavingKeyInsights(false);
    }
  };

  const handleDeleteKeyInsight = async (index: number) => {
    if (!user || !idea) return;
    
    setIsSavingKeyInsights(true);
    try {
      const updatedKeyInsights = customKeyInsights.filter((_, idx) => idx !== index);
      setCustomKeyInsights(updatedKeyInsights);
      
      // Save to Firestore
      const idToken = await user.getIdToken();
      const response = await fetch('/api/update-custom-key-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ideaId: idea.id,
          idToken,
          customKeyInsights: updatedKeyInsights
        }),
      });

      if (!response.ok) {
        console.error('Failed to save custom key insights');
        // Revert on error
        setCustomKeyInsights(customKeyInsights);
      }
    } catch (error) {
      console.error('Error saving custom key insights:', error);
      // Revert on error
      setCustomKeyInsights(customKeyInsights);
    } finally {
      setIsSavingKeyInsights(false);
    }
  };

  const handleCancelKeyInsight = () => {
    setIsAddingKeyInsight(false);
    setNewKeyInsight("");
    setEditingKeyInsightIndex(null);
    setEditingKeyInsightText("");
  };

  const handleKeyInsightKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (editingKeyInsightIndex !== null) {
        handleSaveEditedKeyInsight();
      } else {
        handleSaveKeyInsight();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelKeyInsight();
    }
  };

  // Custom notes functions - with crash prevention
  const handleAddNote = (itemId: string) => {
    if (!user || !idea) return;
    
    setEditingNoteId(itemId);
    setEditingNoteText(customNotes[itemId] || "");
  };

  const handleSaveNote = async () => {
    if (!user || !idea || !editingNoteId) return;
    
    setIsSavingNotes(true);
    try {
      const trimmedNote = editingNoteText.trim();
      const updatedNotes = { ...customNotes };
      
      if (trimmedNote) {
        updatedNotes[editingNoteId] = trimmedNote;
      } else {
        delete updatedNotes[editingNoteId];
      }
      
      setCustomNotes(updatedNotes);
      setEditingNoteId(null);
      setEditingNoteText("");
      
      // Save to Firestore
      const idToken = await user.getIdToken();
      const response = await fetch('/api/update-custom-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ideaId: idea.id,
          idToken,
          customNotes: updatedNotes
        }),
      });

      if (!response.ok) {
        console.error('Failed to save custom notes');
        // Revert on error
        setCustomNotes(customNotes);
      }
    } catch (error) {
      console.error('Error saving custom notes:', error);
      // Revert on error
      setCustomNotes(customNotes);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleDeleteNote = async (itemId: string) => {
    if (!user || !idea) return;
    
    setIsSavingNotes(true);
    try {
      const updatedNotes = { ...customNotes };
      delete updatedNotes[itemId];
      setCustomNotes(updatedNotes);
      
      // Save to Firestore
      const idToken = await user.getIdToken();
      const response = await fetch('/api/update-custom-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ideaId: idea.id,
          idToken,
          customNotes: updatedNotes
        }),
      });

      if (!response.ok) {
        console.error('Failed to save custom notes');
        // Revert on error
        setCustomNotes(customNotes);
      }
    } catch (error) {
      console.error('Error saving custom notes:', error);
      // Revert on error
      setCustomNotes(customNotes);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleCancelNote = () => {
    setEditingNoteId(null);
    setEditingNoteText("");
  };

  const handleNoteKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveNote();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelNote();
    }
  };

  // Helper function to get note for a specific checklist item
  const getNoteForItem = (itemId: string): string | null => {
    return customNotes[itemId] || null;
  };

  // Regrade functionality
  const handleRegradeClick = () => {
    if (!user) return;
    setIsRegradeModalOpen(true);
  };

  const handleRegradeConfirm = async (userContextNote?: string) => {
    if (!user || !idea) return;
    
    setIsRegrading(true);
    try {
      const idToken = await user.getIdToken();
      
      // Prepare checklist data - we'll use a simplified structure for the regrade API
      const checklistData = [
        // Market potential items
        { category: "marketPotential", item: "Conduct customer interviews", completed: false },
        { category: "marketPotential", item: "Analyze competitor pricing", completed: false },
        { category: "marketPotential", item: "Define unique value proposition", completed: false },
        // Monetization items
        { category: "monetizationClarity", item: "Test pricing with customers", completed: false },
        { category: "monetizationClarity", item: "Research similar pricing models", completed: false },
        { category: "monetizationClarity", item: "Create revenue projection", completed: false },
        // Execution items
        { category: "executionDifficulty", item: "Build MVP", completed: false },
        { category: "executionDifficulty", item: "Set up analytics", completed: false },
        { category: "executionDifficulty", item: "Create technical architecture", completed: false },
      ];

      // Prepare custom fields
      const customFields = {
        target_user_archetype: customArchetypes,
        risk_mitigation_plans: riskMitigations.map(m => `${m.risk}: ${m.mitigation}`),
        key_insights: customKeyInsights,
        checklist_notes: customNotes,
      };

      const response = await fetch('/api/regrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ideaId: idea.id,
          ideaText: idea.ideaText,
          customFields,
          checklist: checklistData,
          userContextNote,
          idToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to regrade idea');
      }

      if (data.success) {
        // Update the idea with new analysis
        const updatedIdea = {
          ...idea,
          analysis: data.analysis,
          summary_analysis: data.summary_analysis,
          ai_action_items: data.ai_action_items,
          ai_key_insights: data.ai_key_insights,
          ai_key_risks: data.ai_key_risks,
          score_explanations: data.score_explanations,
        };

        // Force a refresh of the modal content by triggering a re-render
        // This is a simple approach - in a real app you might want to update the parent state
        window.location.reload();

        toast({
          title: "Idea successfully regraded",
          description: "Your idea has been re-evaluated with the new context.",
        });

        setIsRegradeModalOpen(false);
      } else {
        throw new Error(data.error || 'Regrade operation failed');
      }
    } catch (error) {
      console.error('Error regrading idea:', error);
      toast({
        title: "Regrade failed",
        description: error instanceof Error ? error.message : "Failed to regrade idea. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRegrading(false);
    }
  };

  // Get base score from idea data
  const baseScore = (idea as any)?.baseScore || idea.analysis.overall_score;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">
                Idea Analysis Details
              </DialogTitle>
              <DialogDescription className="text-foreground-muted">
                Detailed breakdown of your idea evaluation
              </DialogDescription>
            </div>
            {user && (
              <Button
                onClick={handleRegradeClick}
                className="btn-primary"
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Regrade Idea
                <div className="ml-2 flex items-center gap-1">
                  <Coins className="w-3 h-3" />
                  <span className="text-xs">1</span>
                </div>
              </Button>
            )}
          </div>
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

          {/* Updated Summary from Regrade */}
          {typeof idea.summary_analysis === 'string' && idea.summary_analysis.trim() && idea.last_regraded_at && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-foreground">Updated Summary</h3>
                <Badge variant="secondary" className="bg-brand/10 text-brand border-brand/20 text-xs">
                  From Regrade
                </Badge>
              </div>
              <Card className="p-4 bg-surface">
                <p className="text-foreground-muted leading-relaxed">{idea.summary_analysis}</p>
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-foreground-muted">
                    Updated on {formatDate(idea.last_regraded_at)}
                  </p>
                </div>
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

          {/* Updated Recommendation from Regrade */}
          {typeof idea.analysis?.recommendation === 'string' && idea.analysis.recommendation.trim() && idea.last_regraded_at && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-foreground">Updated Recommendation</h3>
                <Badge variant="secondary" className="bg-brand/10 text-brand border-brand/20 text-xs">
                  From Regrade
                </Badge>
              </div>
              <div className="space-y-3">
                <p className={`text-lg font-medium ${getRecommendationColor(idea.analysis.recommendation)}`}>
                  {idea.analysis.recommendation}
                </p>
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-foreground-muted">
                    Updated on {formatDate(idea.last_regraded_at)}
                  </p>
                </div>
              </div>
            </div>
          )}

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
              <div className="space-y-4">
                {/* AI-generated insights (always shown) */}
                {idea.analysis.insights.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-foreground-muted mb-2">AI Insights:</p>
                    <ul className="space-y-3">
                      {idea.analysis.insights.map((insight, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-brand rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-foreground leading-relaxed">{insight}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Custom insights */}
                {customKeyInsights.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Your Insights:</p>
                    <div className="space-y-2">
                      {customKeyInsights.map((insight, index) => {
                        const isEditing = editingKeyInsightIndex === index;
                        
                        return (
                          <div key={index} className="p-3 bg-brand/5 border border-brand/20 rounded-lg">
                            {isEditing ? (
                              <div className="space-y-2">
                                <Input
                                  value={editingKeyInsightText}
                                  onChange={(e) => setEditingKeyInsightText(e.target.value)}
                                  onKeyDown={handleKeyInsightKeyPress}
                                  placeholder="Enter your insight..."
                                  className="w-full"
                                  disabled={isSavingKeyInsights}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    onClick={handleSaveEditedKeyInsight}
                                    disabled={!editingKeyInsightText.trim() || isSavingKeyInsights}
                                    size="sm"
                                    className="btn-primary"
                                  >
                                    {isSavingKeyInsights ? (
                                      <div className="w-4 h-4 border-2 border-brand-foreground/30 border-t-brand-foreground rounded-full animate-spin" />
                                    ) : (
                                      'Save'
                                    )}
                                  </Button>
                                  <Button
                                    onClick={handleCancelKeyInsight}
                                    disabled={isSavingKeyInsights}
                                    variant="outline"
                                    size="sm"
                                    className="btn-secondary"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="text-sm text-foreground leading-relaxed">{insight}</p>
                                </div>
                                {user && (
                                  <div className="flex gap-1">
                                    <Button
                                      onClick={() => handleEditKeyInsight(index)}
                                      disabled={isSavingKeyInsights}
                                      variant="outline"
                                      size="sm"
                                      className="btn-secondary"
                                    >
                                      ✏️
                                    </Button>
                                    <Button
                                      onClick={() => handleDeleteKeyInsight(index)}
                                      disabled={isSavingKeyInsights}
                                      variant="outline"
                                      size="sm"
                                      className="btn-secondary text-red-500 hover:text-red-600"
                                    >
                                      ❌
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Add new insight input */}
                {isAddingKeyInsight && (
                  <div className="space-y-2">
                    <Input
                      value={newKeyInsight}
                      onChange={(e) => setNewKeyInsight(e.target.value)}
                      onKeyDown={handleKeyInsightKeyPress}
                      placeholder="Enter a new insight..."
                      className="w-full"
                      disabled={isSavingKeyInsights}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveKeyInsight}
                        disabled={!newKeyInsight.trim() || isSavingKeyInsights}
                        size="sm"
                        className="btn-primary"
                      >
                        {isSavingKeyInsights ? (
                          <div className="w-4 h-4 border-2 border-brand-foreground/30 border-t-brand-foreground rounded-full animate-spin" />
                        ) : (
                          'Save'
                        )}
                      </Button>
                      <Button
                        onClick={handleCancelKeyInsight}
                        disabled={isSavingKeyInsights}
                        variant="outline"
                        size="sm"
                        className="btn-secondary"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Add insight button for authenticated users */}
                {user && !isAddingKeyInsight && (
                  <div>
                    <Button
                      onClick={handleAddKeyInsight}
                      disabled={isSavingKeyInsights}
                      variant="outline"
                      size="sm"
                      className="btn-secondary"
                    >
                      + Add
                    </Button>
                  </div>
                )}

                {/* New Insights from Regrade */}
                {Array.isArray(idea.ai_key_insights) && idea.ai_key_insights.length > 0 && idea.last_regraded_at && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-medium text-foreground">New Insights from Regrade</p>
                      <Badge variant="secondary" className="bg-brand/10 text-brand border-brand/20 text-xs">
                        From Regrade
                      </Badge>
                    </div>
                    <ul className="space-y-3">
                      {idea.ai_key_insights.map((insight, index) => (
                        <li key={index} className="flex items-start gap-3 p-3 bg-brand/5 border border-brand/20 rounded-lg">
                          <div className="w-2 h-2 bg-brand rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-foreground leading-relaxed">{insight}</p>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-foreground-muted">
                        Updated on {formatDate(idea.last_regraded_at)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
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
                    const isEditing = editingRiskIndex === index;
                    
                    return (
                      <li key={index} className="space-y-2">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div className="flex-1">
                            <p className="text-foreground leading-relaxed">
                              {riskText}
                            </p>
                            
                            {/* Show existing mitigation if available */}
                            {existingMitigation && !isEditing && (
                              <div className="mt-2 p-3 bg-brand/5 border border-brand/20 rounded-lg">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-brand mb-1">Mitigation Plan:</p>
                                    <p className="text-sm text-foreground leading-relaxed">{existingMitigation}</p>
                                  </div>
                                  {user && (
                                    <div className="flex gap-1">
                                      <Button
                                        onClick={() => handleAddMitigation(index, riskText)}
                                        disabled={isSavingMitigation}
                                        variant="outline"
                                        size="sm"
                                        className="btn-secondary"
                                      >
                                        ✏️
                                      </Button>
                                      <Button
                                        onClick={() => handleDeleteMitigation(riskText)}
                                        disabled={isSavingMitigation}
                                        variant="outline"
                                        size="sm"
                                        className="btn-secondary text-red-500 hover:text-red-600"
                                      >
                                        ❌
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Add/Edit mitigation input */}
                            {isEditing && (
                              <div className="mt-2 space-y-2">
                                <textarea
                                  value={editingMitigation}
                                  onChange={(e) => setEditingMitigation(e.target.value)}
                                  onKeyDown={handleMitigationKeyPress}
                                  placeholder="Add your mitigation plan for this risk..."
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
                            
                            {/* Add mitigation button for authenticated users */}
                            {user && !existingMitigation && !isEditing && (
                              <div className="mt-2">
                                <Button
                                  onClick={() => handleAddMitigation(index, riskText)}
                                  disabled={isSavingMitigation}
                                  variant="outline"
                                  size="sm"
                                  className="btn-secondary"
                                >
                                  + Add
                                </Button>
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

          {/* New Risks from Regrade */}
          {Array.isArray(idea.ai_key_risks) && idea.ai_key_risks.length > 0 && idea.last_regraded_at && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-foreground">New Risks Identified</h3>
                <Badge variant="secondary" className="bg-brand/10 text-brand border-brand/20 text-xs">
                  From Regrade
                </Badge>
              </div>
              <Card className="p-4">
                <ul className="space-y-4">
                  {idea.ai_key_risks.map((risk, index) => (
                    <li key={index} className="space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                          <p className="text-foreground leading-relaxed">
                            {risk}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-foreground-muted">
                    Updated on {formatDate(idea.last_regraded_at)}
                  </p>
                </div>
              </Card>
            </div>
          )}

          {/* User Archetype */}
          {idea.userArchetype && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-foreground">Target User Archetype</h3>
              </div>
              <Card className="p-4">
                <div className="space-y-4">
                  {/* AI-generated archetype (always shown) */}
                  <div>
                    <p className="text-sm font-medium text-foreground-muted mb-2">AI Suggestion:</p>
                    {typeof idea.userArchetype === 'string' ? (
                      <p className="text-foreground leading-relaxed">{idea.userArchetype}</p>
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
                  
                  {/* Custom user archetypes */}
                  {customArchetypes.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Your User Types:</p>
                      <div className="space-y-2">
                        {customArchetypes.map((archetype, index) => {
                          const isEditing = editingArchetypeIndex === index;
                          
                          return (
                            <div key={index} className="p-3 bg-brand/5 border border-brand/20 rounded-lg">
                              {isEditing ? (
                                <div className="space-y-2">
                                  <Input
                                    value={editingArchetypeText}
                                    onChange={(e) => setEditingArchetypeText(e.target.value)}
                                    onKeyDown={handleArchetypeListKeyPress}
                                    placeholder="Enter user type..."
                                    className="w-full"
                                    disabled={isSavingArchetypes}
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={handleSaveEditedArchetypeInList}
                                      disabled={!editingArchetypeText.trim() || isSavingArchetypes}
                                      size="sm"
                                      className="btn-primary"
                                    >
                                      {isSavingArchetypes ? (
                                        <div className="w-4 h-4 border-2 border-brand-foreground/30 border-t-brand-foreground rounded-full animate-spin" />
                                      ) : (
                                        'Save'
                                      )}
                                    </Button>
                                    <Button
                                      onClick={handleCancelArchetypeList}
                                      disabled={isSavingArchetypes}
                                      variant="outline"
                                      size="sm"
                                      className="btn-secondary"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <p className="text-sm text-foreground leading-relaxed">{archetype}</p>
                                  </div>
                                  {user && (
                                    <div className="flex gap-1">
                                      <Button
                                        onClick={() => handleEditArchetypeInList(index)}
                                        disabled={isSavingArchetypes}
                                        variant="outline"
                                        size="sm"
                                        className="btn-secondary"
                                      >
                                        ✏️
                                      </Button>
                                      <Button
                                        onClick={() => handleDeleteArchetypeFromList(index)}
                                        disabled={isSavingArchetypes}
                                        variant="outline"
                                        size="sm"
                                        className="btn-secondary text-red-500 hover:text-red-600"
                                      >
                                        ❌
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Add new archetype input */}
                  {isAddingArchetype && (
                    <div className="space-y-2">
                      <Input
                        value={newArchetype}
                        onChange={(e) => setNewArchetype(e.target.value)}
                        onKeyDown={handleArchetypeListKeyPress}
                        placeholder="Enter a new user type..."
                        className="w-full"
                        disabled={isSavingArchetypes}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSaveArchetypeToList}
                          disabled={!newArchetype.trim() || isSavingArchetypes}
                          size="sm"
                          className="btn-primary"
                        >
                          {isSavingArchetypes ? (
                            <div className="w-4 h-4 border-2 border-brand-foreground/30 border-t-brand-foreground rounded-full animate-spin" />
                          ) : (
                            'Save'
                          )}
                        </Button>
                        <Button
                          onClick={handleCancelArchetypeList}
                          disabled={isSavingArchetypes}
                          variant="outline"
                          size="sm"
                          className="btn-secondary"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Add archetype button for authenticated users */}
                  {user && !isAddingArchetype && (
                    <div>
                      <Button
                        onClick={handleAddArchetypeToList}
                        disabled={isSavingArchetypes}
                        variant="outline"
                        size="sm"
                        className="btn-secondary"
                      >
                        + Add
                      </Button>
                    </div>
                  )}
                </div>
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

          {/* Action Items from Regrade */}
          {Array.isArray(idea.ai_action_items) && idea.ai_action_items.length > 0 && idea.last_regraded_at && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-foreground">New Action Items</h3>
                <Badge variant="secondary" className="bg-brand/10 text-brand border-brand/20 text-xs">
                  From Regrade
                </Badge>
              </div>
              <Card className="p-4">
                <div className="space-y-4">
                  {idea.ai_action_items.map((actionGroup, groupIndex) => (
                    <div key={groupIndex} className="space-y-3">
                      <h4 className="font-medium text-foreground">{actionGroup.category}</h4>
                      <ul className="space-y-2">
                        {Array.isArray(actionGroup.items) && actionGroup.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-brand rounded-full mt-2 flex-shrink-0"></div>
                            <p className="text-foreground leading-relaxed">{item}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-foreground-muted">
                      Updated on {formatDate(idea.last_regraded_at)}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Action Items Checklist */}
          <div className="space-y-3">
            <IdeaChecklist 
              ideaId={idea.id} 
              ideaText={idea.ideaText} 
              baseScore={baseScore} 
              onScoreUpdate={handleScoreUpdate}
              // Notes functionality
              customNotes={customNotes}
              onAddNote={handleAddNote}
              onSaveNote={handleSaveNote}
              onDeleteNote={handleDeleteNote}
              onCancelNote={handleCancelNote}
              editingNoteId={editingNoteId}
              editingNoteText={editingNoteText}
              onEditingNoteTextChange={setEditingNoteText}
              onNoteKeyPress={handleNoteKeyPress}
              isSavingNotes={isSavingNotes}
              getNoteForItem={getNoteForItem}
            />
          </div>
        </div>
      </DialogContent>

      {/* Regrade Confirmation Modal */}
      <RegradeConfirmationModal
        isOpen={isRegradeModalOpen}
        onClose={() => setIsRegradeModalOpen(false)}
        onConfirm={handleRegradeConfirm}
        tokenBalance={tokenBalance}
        isLoading={isRegrading}
      />
    </Dialog>
  );
} 