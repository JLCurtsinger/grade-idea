import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  ChecklistData, 
  getOrCreateChecklist, 
  updateChecklistItem as updateChecklistItemFirestore 
} from "@/lib/checklist";

interface UseChecklistReturn {
  checklistData: ChecklistData | null;
  loading: boolean;
  error: string | null;
  updateChecklistItem: (section: keyof ChecklistData, itemId: string, completed: boolean) => Promise<void>;
  refreshChecklist: () => Promise<void>;
}

export function useChecklist(ideaId: string): UseChecklistReturn {
  const { user } = useAuth();
  const [checklistData, setChecklistData] = useState<ChecklistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadChecklist = useCallback(async () => {
    if (!user || !ideaId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getOrCreateChecklist(ideaId, user.uid);
      console.log('Checklist data loaded:', {
        ideaId,
        userId: user.uid,
        sections: Object.keys(data),
        totalSuggestions: Object.values(data).reduce((acc, section) => acc + section.suggestions.length, 0),
        suggestionsWithPlans: Object.values(data).reduce((acc, section) => 
          acc + section.suggestions.filter(s => s.plan).length, 0
        )
      });
      setChecklistData(data);
    } catch (err) {
      console.error("Error loading checklist:", err);
      setError("Failed to load checklist data");
    } finally {
      setLoading(false);
    }
  }, [user, ideaId]);

  const updateChecklistItem = useCallback(async (
    section: keyof ChecklistData, 
    itemId: string, 
    completed: boolean
  ) => {
    if (!user || !ideaId) return;

    try {
      // Optimistic update for immediate UI feedback
      setChecklistData(prevData => {
        if (!prevData) return prevData;
        
        return {
          ...prevData,
          [section]: {
            ...prevData[section],
            suggestions: prevData[section].suggestions.map(item =>
              item.id === itemId ? { ...item, completed } : item
            )
          }
        };
      });

      // Persist to Firestore
      await updateChecklistItemFirestore(ideaId, user.uid, section, itemId, completed);
    } catch (err) {
      console.error("Error updating checklist item:", err);
      
      // Revert optimistic update on error
      await loadChecklist();
      setError("Failed to save checklist changes");
    }
  }, [user, ideaId, loadChecklist]);

  const refreshChecklist = useCallback(async () => {
    await loadChecklist();
  }, [loadChecklist]);

  useEffect(() => {
    loadChecklist();
  }, [loadChecklist]);

  return {
    checklistData,
    loading,
    error,
    updateChecklistItem,
    refreshChecklist
  };
} 