"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CurrentIdeaContextType {
  currentIdea: string | null;
  currentIdeaId: string | null;
  setCurrentIdea: (idea: string | null, ideaId?: string | null) => void;
}

const CurrentIdeaContext = createContext<CurrentIdeaContextType | undefined>(undefined);

export const useCurrentIdea = () => {
  const context = useContext(CurrentIdeaContext);
  if (context === undefined) {
    throw new Error('useCurrentIdea must be used within a CurrentIdeaProvider');
  }
  return context;
};

interface CurrentIdeaProviderProps {
  children: ReactNode;
}

export const CurrentIdeaProvider: React.FC<CurrentIdeaProviderProps> = ({ children }) => {
  const [currentIdea, setCurrentIdeaText] = useState<string | null>(null);
  const [currentIdeaId, setCurrentIdeaId] = useState<string | null>(null);

  const setCurrentIdea = (idea: string | null, ideaId?: string | null) => {
    setCurrentIdeaText(idea);
    setCurrentIdeaId(ideaId || null);
  };

  return (
    <CurrentIdeaContext.Provider value={{ currentIdea, currentIdeaId, setCurrentIdea }}>
      {children}
    </CurrentIdeaContext.Provider>
  );
}; 