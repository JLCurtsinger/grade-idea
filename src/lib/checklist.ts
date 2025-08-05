import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  Timestamp 
} from "firebase/firestore";
import { db } from "./firebase";
import { calculateDynamicScoresFromClient } from "./scoring";
import { getAuth } from "firebase/auth";

export interface ChecklistSuggestion {
  id: string;
  text: string;
  completed: boolean;
}

export interface ChecklistSection {
  score: number;
  suggestions: ChecklistSuggestion[];
}

export interface ChecklistData {
  marketPotential: ChecklistSection;
  monetizationClarity: ChecklistSection;
  executionDifficulty: ChecklistSection;
}

export interface ChecklistDocument {
  id?: string;
  idea_id: string;
  user_id: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  sections: ChecklistData;
}

// Default checklist data structure
export const defaultChecklistData: ChecklistData = {
  marketPotential: {
    score: 3,
    suggestions: [
      { id: 'mkt-1', text: 'Estimate your TAM using industry benchmarks', completed: false },
      { id: 'mkt-2', text: 'Validate interest with a short landing page MVP', completed: false },
      { id: 'mkt-3', text: 'Conduct 10 customer interviews', completed: false }
    ]
  },
  monetizationClarity: {
    score: 2,
    suggestions: [
      { id: 'mon-1', text: 'Define 2–3 pricing tiers', completed: true },
      { id: 'mon-2', text: 'Research competitor pricing models', completed: false },
      { id: 'mon-3', text: 'Create a revenue projection model', completed: false }
    ]
  },
  executionDifficulty: {
    score: 4,
    suggestions: [
      { id: 'exec-1', text: 'Outline the core features in a v1 product', completed: false },
      { id: 'exec-2', text: 'Identify technical requirements and stack', completed: false }
    ]
  }
};

/**
 * Fetch checklist by idea ID and user ID
 */
export async function getChecklistByIdea(ideaId: string, userId: string): Promise<ChecklistData | null> {
  try {
    const checklistsRef = collection(db, "checklists");
    const q = query(
      checklistsRef, 
      where("idea_id", "==", ideaId),
      where("user_id", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null; // No checklist exists yet
    }
    
    const doc = querySnapshot.docs[0];
    const data = doc.data() as ChecklistDocument;
    
    return data.sections;
  } catch (error) {
    console.error("Error fetching checklist:", error);
    return null;
  }
}

/**
 * Create a new checklist for an idea
 */
export async function createChecklist(ideaId: string, userId: string, sections: ChecklistData = defaultChecklistData): Promise<void> {
  try {
    const checklistsRef = collection(db, "checklists");
    const newChecklistRef = doc(checklistsRef);
    
    const checklistData: Omit<ChecklistDocument, 'id'> = {
      idea_id: ideaId,
      user_id: userId,
      created_at: serverTimestamp() as Timestamp,
      updated_at: serverTimestamp() as Timestamp,
      sections
    };
    
    await setDoc(newChecklistRef, checklistData);
  } catch (error) {
    console.error("Error creating checklist:", error);
    throw error;
  }
}

/**
 * Update a specific checklist item's completion status
 */
export async function updateChecklistItem(
  ideaId: string, 
  userId: string, 
  section: keyof ChecklistData, 
  itemId: string, 
  completed: boolean
): Promise<void> {
  try {
    // First, find the checklist document
    const checklistsRef = collection(db, "checklists");
    const q = query(
      checklistsRef, 
      where("idea_id", "==", ideaId),
      where("user_id", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    
    let updatedChecklistData: ChecklistData;
    
    if (querySnapshot.empty) {
      // Create a new checklist if it doesn't exist
      await createChecklist(ideaId, userId);
      // Fetch the newly created document
      const newQuerySnapshot = await getDocs(q);
      if (newQuerySnapshot.empty) {
        throw new Error("Failed to create checklist");
      }
      const docRef = newQuerySnapshot.docs[0].ref;
      
      // Update the specific item
      const updatedSuggestions = defaultChecklistData[section].suggestions.map(item =>
        item.id === itemId ? { ...item, completed } : item
      );
      
      await updateDoc(docRef, {
        [`sections.${section}.suggestions`]: updatedSuggestions,
        updated_at: serverTimestamp()
      });
      
      // Create updated checklist data for score calculation
      updatedChecklistData = {
        ...defaultChecklistData,
        [section]: {
          ...defaultChecklistData[section],
          suggestions: updatedSuggestions
        }
      };
    } else {
      // Update existing checklist
      const docRef = querySnapshot.docs[0].ref;
      const currentData = querySnapshot.docs[0].data() as ChecklistDocument;
      
      // Update the specific suggestion
      const updatedSuggestions = currentData.sections[section].suggestions.map(item =>
        item.id === itemId ? { ...item, completed } : item
      );
      
      await updateDoc(docRef, {
        [`sections.${section}.suggestions`]: updatedSuggestions,
        updated_at: serverTimestamp()
      });
      
      // Create updated checklist data for score calculation
      updatedChecklistData = {
        ...currentData.sections,
        [section]: {
          ...currentData.sections[section],
          suggestions: updatedSuggestions
        }
      };
    }
    
    // Calculate dynamic scores for client-side updates
    const dynamicScores = calculateDynamicScoresFromClient(updatedChecklistData);
    
    // Call API to update scores on server
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        const idToken = await currentUser.getIdToken();
        
        const response = await fetch('/api/update-idea-scores', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ideaId,
            idToken,
            checklistData: updatedChecklistData
          }),
        });
        
        if (!response.ok) {
          console.error('Failed to update idea scores:', await response.text());
        }
      }
    } catch (error) {
      console.error('Error updating idea scores:', error);
    }
    
  } catch (error) {
    console.error("Error updating checklist item:", error);
    throw error;
  }
}

/**
 * Get or create checklist for an idea
 */
export async function getOrCreateChecklist(ideaId: string, userId: string): Promise<ChecklistData> {
  const existingChecklist = await getChecklistByIdea(ideaId, userId);
  
  if (existingChecklist) {
    return existingChecklist;
  }
  
  // Create new checklist with default data
  await createChecklist(ideaId, userId);
  return defaultChecklistData;
} 