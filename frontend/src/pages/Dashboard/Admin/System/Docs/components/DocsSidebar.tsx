import React from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
  Collapse,
} from '@mui/material';
import type { DocCategory, DocFile } from '../types';
import { DOCUMENTATION_STRUCTURE } from '../constants';

interface DocsSidebarProps {
  selectedDoc: DocFile | null;
  expandedCategory: string;
  onCategoryClick: (categoryName: string) => void;
  onDocClick: (doc: DocFile) => void;
}

export const DocsSidebar: React.FC<DocsSidebarProps> = ({
  selectedDoc,
  expandedCategory,
  onCategoryClick,
  onDocClick
}) => {
  return (
    <Paper 
      sx={{ 
        p: 2, 
        position: 'sticky', 
        top: 20,
        bgcolor: 'background.paper',
        borderRadius: 2,
        height: { xs: 'auto', md: 'calc(100vh - 120px)' },
        overflowY: 'auto',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        '&::-webkit-scrollbar': {
          width: '6px'
        },
        '&::-webkit-scrollbar-track': {
          bgcolor: 'transparent'
        },
        '&::-webkit-scrollbar-thumb': {
          bgcolor: (theme) => theme.palette.grey[300],
          borderRadius: '3px',
          '&:hover': {
            bgcolor: (theme) => theme.palette.grey[400]
          }
        }
      }}
    >
      <Typography 
        variant="subtitle1" 
        gutterBottom 
        sx={{ 
          mb: 2,
          pb: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          fontWeight: 'bold'
        }}
      >
        Dostupná dokumentace
      </Typography>
      <List sx={{ '& .MuiListItem-root': { mb: 0.5 } }}>
        {DOCUMENTATION_STRUCTURE.map((category) => (
          <React.Fragment key={category.name}>
            <ListItem 
              disablePadding 
              sx={{ mb: 1 }}
              onClick={() => onCategoryClick(category.name)}
            >
              <ListItemButton
                sx={{
                  borderRadius: 1,
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <ListItemText
                  primary={
                    <Box className="flex items-center justify-between">
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {category.title}
                      </Typography>
                      <Box 
                        component="span" 
                        sx={{ 
                          transform: expandedCategory === category.name ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s',
                          fontSize: '0.8rem'
                        }}
                      >
                        ▼
                      </Box>
                    </Box>
                  }
                />
              </ListItemButton>
            </ListItem>
            <Collapse in={expandedCategory === category.name}>
              <List component="div" disablePadding>
                {category.files.map((doc) => (
                  <ListItem key={doc.name} disablePadding sx={{ pl: 2 }}>
                    <ListItemButton
                      selected={selectedDoc?.name === doc.name}
                      onClick={() => onDocClick(doc)}
                      sx={{
                        borderRadius: 1,
                        py: 0.5,
                        '&.Mui-selected': {
                          backgroundColor: 'primary.main',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: 'primary.dark',
                          }
                        }
                      }}
                    >
                      <ListItemText 
                        primary={doc.title}
                        sx={{
                          '& .MuiTypography-root': {
                            fontSize: '0.9rem'
                          }
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};
