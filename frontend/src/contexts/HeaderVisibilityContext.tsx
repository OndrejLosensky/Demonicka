import React, { createContext, useContext, useState, ReactNode } from 'react';

interface HeaderVisibilityContextType {
  isHeaderVisible: boolean;
  toggleHeader: () => void;
  setHeaderVisible: (visible: boolean) => void;
}

const HeaderVisibilityContext = createContext<HeaderVisibilityContextType | undefined>(undefined);

export const useHeaderVisibility = (): HeaderVisibilityContextType => {
  const context = useContext(HeaderVisibilityContext);
  if (context === undefined) {
    throw new Error('useHeaderVisibility must be used within a HeaderVisibilityProvider');
  }
  return context;
};

interface HeaderVisibilityProviderProps {
  children: ReactNode;
}

export const HeaderVisibilityProvider: React.FC<HeaderVisibilityProviderProps> = ({ children }) => {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  const toggleHeader = () => {
    setIsHeaderVisible(prev => !prev);
  };

  const setHeaderVisible = (visible: boolean) => {
    setIsHeaderVisible(visible);
  };

  const value: HeaderVisibilityContextType = {
    isHeaderVisible,
    toggleHeader,
    setHeaderVisible,
  };

  return (
    <HeaderVisibilityContext.Provider value={value}>
      {children}
    </HeaderVisibilityContext.Provider>
  );
};
