import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
  Alert,
  Collapse,
  CircularProgress,
} from '@mui/material';
import { motion } from 'framer-motion';
import { SimpleMarkdownParser } from '../utils/markdownParser';
import { apiClient } from '../utils/apiClient';
import '../styles/markdown.css';
import { withPageLoader } from '../components/hoc/withPageLoader';

interface DocFile {
  name: string;
  title: string;
  description: string;
  path: string;
}

interface DocCategory {
  name: string;
  title: string;
  description: string;
  files: DocFile[];
}

const documentationStructure: DocCategory[] = [
  {
    name: 'getting-started',
    title: 'Začínáme',
    description: 'Základní informace a průvodce aplikací',
    files: [
      {
        name: 'intro',
        title: 'Úvod do aplikace',
        description: 'Základní přehled a koncept aplikace',
        path: 'getting-started/intro.md'
      },
      {
        name: 'create-event',
        title: 'Vytvoření události',
        description: 'Jak vytvořit novou událost',
        path: 'getting-started/create-event.md'
      },
      {
        name: 'add-users',
        title: 'Přidání uživatelů',
        description: 'Jak přidat účastníky a aktivovat je',
        path: 'getting-started/add-users.md'
      }
    ]
  },
  {
    name: 'user-guide',
    title: 'Uživatelská příručka',
    description: 'Detailní návody pro používání aplikace',
    files: [
      {
        name: 'dashboard',
        title: 'Dashboard',
        description: 'Přehled a používání dashboardu',
        path: 'user-guide/dashboard.md'
      },
      {
        name: 'participants',
        title: 'Účastníci',
        description: 'Správa účastníků a jejich role',
        path: 'user-guide/participants.md'
      },
      {
        name: 'barrels',
        title: 'Sudy',
        description: 'Jak funguje správa sudů',
        path: 'user-guide/barrels.md'
      },
      {
        name: 'achievements',
        title: 'Úspěchy',
        description: 'Systém úspěchů a odměn',
        path: 'user-guide/achievements.md'
      },
      {
        name: 'events',
        title: 'Události',
        description: 'Správa a konfigurace událostí',
        path: 'user-guide/events.md'
      },
      {
        name: 'leaderboard',
        title: 'Žebříček',
        description: 'Žebříček a statistiky',
        path: 'user-guide/leaderboard.md'
      }
    ]
  },
  {
    name: 'api',
    title: 'API Dokumentace',
    description: 'Kompletní dokumentace API endpointů',
    files: [
      {
        name: 'overview',
        title: 'Přehled API',
        description: 'Základní informace o API',
        path: 'api/API.md'
      }
    ]
  }
];

const DocsComponent: React.FC = () => {
  const [selectedDoc, setSelectedDoc] = useState<DocFile | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string>('getting-started');
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load intro doc by default
  useEffect(() => {
    const introDoc = documentationStructure[0].files[0];
    loadMarkdownFile(introDoc);
  }, []);

  const loadMarkdownFile = async (docFile: DocFile) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading doc path:', docFile.path);
      
      // Use the API client with proper configuration
      const response = await apiClient.get(`/v1/docs/${docFile.path}`, {
        responseType: 'text'
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      const content = response.data;
      console.log('Content received:', content.substring(0, 200) + '...');
      
      if (!content || content.trim() === '') {
        throw new Error('Empty content received');
      }
      
      setMarkdownContent(content);
      setSelectedDoc(docFile);
    } catch (err) {
      console.error('Error loading doc:', err);
      setError(`Failed to load documentation: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setMarkdownContent('');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryName: string) => {
    setExpandedCategory(expandedCategory === categoryName ? '' : categoryName);
  };

  const renderMarkdownContent = () => {
    if (!markdownContent) {
      return (
        <Typography variant="body1" color="text.secondary">
          Vyberte dokumentaci z levého menu...
        </Typography>
      );
    }

    try {
      const htmlContent = SimpleMarkdownParser.parse(markdownContent);
      return (
        <div 
          className="markdown-content"
          dangerouslySetInnerHTML={{ __html: htmlContent }} 
        />
      );
    } catch (err) {
      console.error('Error parsing markdown:', err);
      return (
        <Alert severity="error">
          Chyba při zpracování obsahu dokumentace
        </Alert>
      );
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        {/* Sidebar */}
        <Grid item xs={12} md={3}>
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
              {documentationStructure.map((category) => (
                <React.Fragment key={category.name}>
                  <ListItem 
                    disablePadding 
                    sx={{ mb: 1 }}
                    onClick={() => handleCategoryClick(category.name)}
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
                            onClick={() => loadMarkdownFile(doc)}
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
        </Grid>

        {/* Content */}
        <Grid item xs={12} md={9}>
          <Paper 
            sx={{ 
              p: { xs: 2, md: 4 },
              minHeight: { md: 'calc(100vh - 120px)' },
              bgcolor: 'background.paper',
              borderRadius: 2,
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
          >
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
                <Box mt={2}>
                  <Typography variant="body2">
                    Zkuste obnovit stránku nebo kontaktujte správce systému.
                  </Typography>
                </Box>
              </Alert>
            ) : selectedDoc ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {selectedDoc.title}
                  </Typography>
                  <Typography variant="body1" color="textSecondary">
                    {selectedDoc.description}
                  </Typography>
                </Box>
                {renderMarkdownContent()}
              </motion.div>
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <Typography variant="h6" color="text.secondary">
                  Vyberte dokumentaci z levého menu
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export const Docs = withPageLoader(DocsComponent); 