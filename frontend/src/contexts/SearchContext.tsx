import React, { createContext, useContext, useState } from 'react';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'participant' | 'event' | 'barrel' | 'page';
  path: string;
  icon: string;
}

interface SearchContextType {
  isSearchOpen: boolean;
  searchQuery: string;
  searchResults: SearchResult[];
  isLoading: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  setSearchQuery: (query: string) => void;
  performSearch: (query: string) => Promise<void>;
  clearSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

interface SearchProviderProps {
  children: React.ReactNode;
}

export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const openSearch = () => setIsSearchOpen(true);
  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    
    // Simulate search delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Mock search results - in real app, this would be an API call
    const mockResults: SearchResult[] = [
      {
        id: '1',
        title: 'Dashboard',
        description: 'Hlavní přehled aplikace',
        type: 'page',
        path: '/dashboard',
        icon: 'dashboard'
      },
      {
        id: '2',
        title: 'Účastníci',
        description: 'Správa účastníků události',
        type: 'page',
        path: '/dashboard/participants',
        icon: 'people'
      },
      {
        id: '3',
        title: 'Sudy',
        description: 'Správa pivních sudů',
        type: 'page',
        path: '/dashboard/barrels',
        icon: 'local_drink'
      },
      {
        id: '4',
        title: 'Žebříček',
        description: 'Statistiky a pořadí účastníků',
        type: 'page',
        path: '/leaderboard',
        icon: 'leaderboard'
      },
      {
        id: '5',
        title: 'Události',
        description: 'Správa událostí',
        type: 'page',
        path: '/events',
        icon: 'event'
      }
    ].filter(result => 
      result.title.toLowerCase().includes(query.toLowerCase()) ||
      result.description.toLowerCase().includes(query.toLowerCase())
    );

    setSearchResults(mockResults);
    setIsLoading(false);
  };

  return (
    <SearchContext.Provider value={{
      isSearchOpen,
      searchQuery,
      searchResults,
      isLoading,
      openSearch,
      closeSearch,
      setSearchQuery,
      performSearch,
      clearSearch
    }}>
      {children}
    </SearchContext.Provider>
  );
};
