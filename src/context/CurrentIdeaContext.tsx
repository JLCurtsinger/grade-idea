"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CurrentIdeaContextType {
  currentIdea: string | null;
  setCurrentIdea: (idea: string | null) => void;
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
  const [currentIdea, setCurrentIdea] = useState<string | null>(null);

  return (
    <CurrentIdeaContext.Provider value={{ currentIdea, setCurrentIdea }}>
      {children}
    </CurrentIdeaContext.Provider>
  );
}; 