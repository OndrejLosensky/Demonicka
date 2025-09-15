import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  CircularProgress,
  Divider,
  Chip
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../../contexts/SearchContext';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'participant' | 'event' | 'barrel' | 'page';
  path: string;
  icon: string;
}

interface SearchResultsProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
}

const typeColors = {
  participant: 'primary',
  event: 'secondary',
  barrel: 'success',
  page: 'default'
} as const;

const typeLabels = {
  participant: 'Účastník',
  event: 'Událost',
  barrel: 'Sud',
  page: 'Stránka'
} as const;

const iconMap: { [key: string]: string } = {
  dashboard: 'dashboard',
  people: 'people',
  local_drink: 'local_drink',
  leaderboard: 'leaderboard',
  event: 'event',
  person: 'person',
  analytics: 'analytics',
  settings: 'settings'
};

export const SearchResults: React.FC<SearchResultsProps> = ({ anchorEl, open, onClose }) => {
  const { searchQuery, searchResults, isLoading } = useSearch();
  const navigate = useNavigate();

  const handleResultClick = (result: SearchResult) => {
    navigate(result.path);
    onClose();
  };

  if (!open || !searchQuery.trim()) {
    return null;
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 0,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              zIndex: 1300,
              maxHeight: 400,
              overflow: 'hidden',
              mt: 1
            }}
          >
            {/* Search Header */}
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" color="text.secondary">
                Výsledky pro "{searchQuery}"
              </Typography>
            </Box>

            {/* Loading State */}
            {isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={24} />
              </Box>
            )}

            {/* Results */}
            {!isLoading && searchResults.length > 0 && (
              <List sx={{ py: 1 }}>
                {searchResults.map((result, index) => (
                  <React.Fragment key={result.id}>
                    <ListItem disablePadding>
                      <ListItemButton
                        onClick={() => handleResultClick(result)}
                        sx={{
                          px: 2,
                          py: 1,
                          '&:hover': {
                            bgcolor: 'action.hover'
                          }
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <Box
                            component="span"
                            className="material-icons"
                            sx={{
                              fontSize: '1.2rem',
                              color: 'text.secondary'
                            }}
                          >
                            {iconMap[result.icon] || 'search'}
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                                {result.title}
                              </Typography>
                              <Chip
                                label={typeLabels[result.type]}
                                size="small"
                                color={typeColors[result.type]}
                                sx={{ height: 20, fontSize: '0.7rem', borderRadius: 0 }}
                              />
                            </Box>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {result.description}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                    {index < searchResults.length - 1 && <Divider sx={{ opacity: 0.5 }} />}
                  </React.Fragment>
                ))}
              </List>
            )}

            {/* No Results */}
            {!isLoading && searchResults.length === 0 && (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Žádné výsledky nenalezeny
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Zkuste jiný vyhledávací termín
                </Typography>
              </Box>
            )}

            {/* Footer */}
            <Box sx={{ 
              p: 2, 
              bgcolor: 'background.default',
              borderTop: '1px solid',
              borderColor: 'divider'
            }}>
              <Typography variant="caption" color="text.secondary">
                Stiskněte Enter pro vyhledání nebo Esc pro zavření
              </Typography>
            </Box>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
