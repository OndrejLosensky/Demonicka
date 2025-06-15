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
  CircularProgress,
  Alert,
  Collapse
} from '@mui/material';
import { motion } from 'framer-motion';
import { FaBook } from 'react-icons/fa';
import { SimpleMarkdownParser } from '../utils/markdownParser';
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
        name: 'first-steps',
        title: 'První kroky',
        description: 'Jak začít používat aplikaci',
        path: 'getting-started/first-steps.md'
      },
      {
        name: 'user-management',
        title: 'Správa uživatelů',
        description: 'Jak vytvářet a spravovat uživatele',
        path: 'getting-started/user-management.md'
      },
      {
        name: 'events',
        title: 'Události',
        description: 'Vytváření a správa událostí',
        path: 'getting-started/events.md'
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
        title: 'Žebříček',
        description: 'Jak funguje bodování a žebříček',
        path: 'user-guide/barrels.md'
      }
    ]
  },
  {
    name: 'implementation',
    title: 'Implementace',
    description: 'Plány implementace a vývoje nových funkcí',
    files: [
      {
        name: 'ui-update',
        title: 'Aktualizace UI',
        description: 'Plán implementace nového uživatelského rozhraní',
        path: 'implementation/ui-update.md'
      },
      {
        name: 'backend-update',
        title: 'Backend logika',
        description: 'Plán implementace nové backend logiky',
        path: 'implementation/backend-update.md'
      },
      {
        name: 'swift-admin',
        title: 'Swift Admin App',
        description: 'Plán implementace iOS aplikace pro správu',
        path: 'implementation/swift-admin.md'
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
      
      const pathSegments = docFile.path.split('/');
      const encodedSegments = pathSegments.map(segment => encodeURIComponent(segment.trim()));
      const encodedPath = encodedSegments.join('%2F');
      
      console.log('Encoded path:', encodedPath);
      
      const response = await fetch(`/api/v1/docs/${encodedPath}`);
      if (!response.ok) {
        throw new Error(`Failed to load ${docFile.title}`);
      }
      
      const content = await response.text();
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
    setExpandedCategory(expandedCategory === categoryName ? categoryName : categoryName);
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
              null // withPageLoader will handle loading state
            ) : error ? (
              <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
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
                <div className="markdown-content">
                  <div dangerouslySetInnerHTML={{ __html: SimpleMarkdownParser.parse(markdownContent) }} />
                </div>
              </motion.div>
            ) : null}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export const Docs = withPageLoader(DocsComponent); 