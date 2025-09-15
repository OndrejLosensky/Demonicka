import React, { createContext, useContext, useState, useEffect } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

interface SidebarProviderProps {
  children: React.ReactNode;
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Get from localStorage or default to false
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev: boolean) => !prev);
  };

  const setCollapsed = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
  };

  // Save to localStorage when collapsed state changes
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleCollapse, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
};
