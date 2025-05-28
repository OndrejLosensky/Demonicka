import React, { useState } from 'react';
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
  Chip,
  CircularProgress,
  Alert,
  Collapse
} from '@mui/material';
import { motion } from 'framer-motion';
import { FaBook, FaFileAlt } from 'react-icons/fa';
import { SimpleMarkdownParser } from '../utils/markdownParser';
import '../styles/markdown.css';

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
        name: 'get-started',
        title: 'Začínáme',
        description: 'Průvodce pro nové uživatele',
        path: 'get-started.md'
      }
    ]
  },
  {
    name: 'features',
    title: 'Funkce & Možnosti',
    description: 'Přehled všech funkcí a možností aplikace',
    files: [
      {
        name: 'core-features',
        title: 'Základní funkce',
        description: 'Přehled základních funkcí a možností aplikace',
        path: 'features/core-features.md'
      },
      {
        name: 'event-system',
        title: 'Systém událostí',
        description: 'Kompletní dokumentace systému událostí',
        path: 'features/event-system.md'
      },
      {
        name: 'user-management',
        title: 'Správa uživatelů',
        description: 'Systém uživatelů, rolí a oprávnění',
        path: 'features/user-management.md'
      },
      {
        name: 'user-participant-unification',
        title: 'Jednotný uživatelský systém',
        description: 'Nový unifikovaný systém pro uživatele a účastníky',
        path: 'features/user-participant-unification.md'
      }
    ]
  },
  {
    name: 'api',
    title: 'API Dokumentace',
    description: 'Technická dokumentace API',
    files: [
      {
        name: 'api-overview',
        title: 'Přehled API',
        description: 'Základní informace o API a autentizaci',
        path: 'api/overview.md'
      },
      {
        name: 'api-events',
        title: 'API Událostí',
        description: 'Endpointy pro práci s událostmi',
        path: 'api/events.md'
      },
      {
        name: 'api-users',
        title: 'API Uživatelů',
        description: 'Endpointy pro správu uživatelů',
        path: 'api/users.md'
      },
      {
        name: 'api-stats',
        title: 'API Statistik',
        description: 'Endpointy pro statistiky a přehledy',
        path: 'api/stats.md'
      }
    ]
  },
  {
    name: 'technical',
    title: 'Technická dokumentace',
    description: 'Architektura a implementační detaily',
    files: [
      {
        name: 'architecture',
        title: 'Architektura',
        description: 'Celková architektura aplikace',
        path: 'technical/architecture.md'
      },
      {
        name: 'security',
        title: 'Bezpečnost',
        description: 'Bezpečnostní prvky a opatření',
        path: 'technical/security.md'
      },
      {
        name: 'deployment',
        title: 'Nasazení',
        description: 'Proces nasazení a konfigurace',
        path: 'technical/deployment.md'
      }
    ]
  },
  {
    name: 'roadmap',
    title: 'Roadmapa & Plány',
    description: 'Budoucí vývoj a plánované funkce',
    files: [
      {
        name: 'planned-features',
        title: 'Plánované funkce',
        description: 'Seznam plánovaných funkcí a vylepšení',
        path: 'roadmap/planned-features.md'
      },
      {
        name: 'enhancement-ideas',
        title: 'Nápady na vylepšení',
        description: 'Sbírka nápadů na budoucí vylepšení',
        path: 'roadmap/enhancement-ideas.md'
      },
      {
        name: 'version-history',
        title: 'Historie verzí',
        description: 'Historie změn a vydaných verzí',
        path: 'roadmap/version-history.md'
      }
    ]
  }
];

export const Docs: React.FC = () => {
  const [selectedDoc, setSelectedDoc] = useState<DocFile | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMarkdownFile = async (docFile: DocFile) => {
    setLoading(true);
    setError(null);
    
    try {
      // Log the path for debugging
      console.log('Loading doc path:', docFile.path);
      
      // Create the path segments and encode each one
      const pathSegments = docFile.path.split('/');
      const encodedSegments = pathSegments.map(segment => encodeURIComponent(segment.trim()));
      
      // Join with forward slashes and ensure proper encoding
      const encodedPath = encodedSegments.join('%2F');
      
      // Log the encoded path for debugging
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
    setExpandedCategory(expandedCategory === categoryName ? null : categoryName);
  };

  return (
    <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, lg: 8 } }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Box className="text-center mb-12">
          <Typography variant="h3" className="flex items-center justify-center gap-4 text-primary font-bold mb-4">
            <FaBook className="text-4xl" />
            Dokumentace
          </Typography>
          <Typography variant="h6" color="textSecondary">
            Kompletní dokumentace aplikace Démonická
          </Typography>
        </Box>
      </motion.div>

      <Grid container spacing={4}>
        {/* Sidebar with document list */}
        <Grid item xs={12} md={3}>
          <Paper 
            sx={{ 
              p: 3, 
              position: 'sticky', 
              top: 20,
              bgcolor: 'background.paper',
              borderRadius: 2,
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
            }}
          >
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                mb: 3,
                pb: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                fontWeight: 'bold'
              }}
            >
              Dostupná dokumentace
            </Typography>
            <List sx={{ '& .MuiListItem-root': { mb: 1 } }}>
              {documentationStructure.map((category) => (
                <React.Fragment key={category.name}>
                  <ListItem 
                    disablePadding 
                    sx={{ mb: 2 }}
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
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                              {category.title}
                            </Typography>
                            <Box 
                              component="span" 
                              sx={{ 
                                transform: expandedCategory === category.name ? 'rotate(180deg)' : 'none',
                                transition: 'transform 0.2s'
                              }}
                            >
                              ▼
                            </Box>
                          </Box>
                        }
                        secondary={category.description}
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
                              '&.Mui-selected': {
                                backgroundColor: 'primary.main',
                                color: 'white',
                                '&:hover': {
                                  backgroundColor: 'primary.dark',
                                },
                                '.MuiListItemText-secondary': {
                                  color: 'rgba(255, 255, 255, 0.7)',
                                },
                                '.MuiSvgIcon-root': {
                                  color: 'white',
                                }
                              },
                              '&:hover': {
                                backgroundColor: selectedDoc?.name === doc.name 
                                  ? 'primary.dark'
                                  : 'rgba(0, 0, 0, 0.04)',
                              },
                            }}
                          >
                            <ListItemText
                              primary={
                                <Box className="flex items-center gap-2 mb-1">
                                  <FaFileAlt className="text-sm" />
                                  <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                                    {doc.title}
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    color: selectedDoc?.name === doc.name 
                                      ? 'rgba(255, 255, 255, 0.7)' 
                                      : 'text.secondary',
                                    lineHeight: 1.4
                                  }}
                                >
                                  {doc.description}
                                </Typography>
                              }
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

        {/* Main content area */}
        <Grid item xs={12} md={9}>
          <Paper 
            sx={{ 
              p: 4, 
              minHeight: '600px',
              borderRadius: 2,
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
            }}
          >
            {loading && (
              <Box className="flex justify-center items-center h-64">
                <CircularProgress />
              </Box>
            )}

            {error && (
              <Alert severity="info" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {!selectedDoc && !loading && (
              <Box className="text-center py-16">
                <FaBook className="text-6xl text-gray-300 mb-4" />
                <Typography variant="h5" color="textSecondary" gutterBottom>
                  Vyberte dokumentaci
                </Typography>
                <Typography color="textSecondary">
                  Klikněte na některou z dostupných dokumentací v levém panelu
                </Typography>
              </Box>
            )}

            {selectedDoc && markdownContent && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="prose prose-lg max-w-none"
              >
                <Box className="mb-6">
                  <Chip 
                    label={selectedDoc.title} 
                    color="primary" 
                    sx={{ 
                      px: 2, 
                      py: 2.5,
                      fontSize: '1rem',
                      fontWeight: 'medium',
                      borderRadius: 2
                    }} 
                  />
                </Box>
                <div
                  className="markdown-content"
                  dangerouslySetInnerHTML={{
                    __html: SimpleMarkdownParser.parse(markdownContent)
                  }}
                />
              </motion.div>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}; 