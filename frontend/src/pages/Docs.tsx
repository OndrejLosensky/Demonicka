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
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import { motion } from 'framer-motion';
import { FaBook, FaFileAlt } from 'react-icons/fa';
import { SimpleMarkdownParser, type MarkdownSection } from '../utils/markdownParser';
import '../styles/markdown.css';

interface DocFile {
  name: string;
  title: string;
  description: string;
  path: string;
}

const availableDocs: DocFile[] = [
  {
    name: 'event-driven-system',
    title: 'Event-Driven System',
    description: 'Complete documentation of the event-driven architecture',
    path: '/docs/event-driven-system.md'
  },
  {
    name: 'api',
    title: 'API Documentation',
    description: 'REST API endpoints and usage examples',
    path: '/docs/API.md'
  },
  {
    name: 'security',
    title: 'Security Enhancements',
    description: 'Security features and best practices',
    path: '/docs/security_enhancements.md'
  },
  {
    name: 'future-updates',
    title: 'Future Updates',
    description: 'Planned features and roadmap',
    path: '/docs/future_updates.md'
  },
  {
    name: 'backend-mobile',
    title: 'Backend Mobile Updates',
    description: 'Mobile backend integration documentation',
    path: '/docs/backend-mobile-updates.md'
  },
  {
    name: 'api-versioning',
    title: 'API Versioning',
    description: 'API versioning strategy and implementation',
    path: '/docs/api-versioning.md'
  },
  {
    name: 'admin-swift',
    title: 'Admin Swift',
    description: 'Swift admin interface documentation',
    path: '/docs/admin-swift.md'
  }
];

export const Docs: React.FC = () => {
  const [selectedDoc, setSelectedDoc] = useState<DocFile | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [tableOfContents, setTableOfContents] = useState<MarkdownSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMarkdownFile = async (docFile: DocFile) => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch from our API endpoint with .md extension
      const response = await fetch(`/api/v1/docs/${docFile.name}.md`);
      if (!response.ok) {
        throw new Error(`Failed to load ${docFile.title}`);
      }
      
      const content = await response.text();
      setMarkdownContent(content);
      setTableOfContents(SimpleMarkdownParser.extractTableOfContents(content));
      setSelectedDoc(docFile);
    } catch (err) {
      setError(`Failed to load documentation: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setMarkdownContent('');
      setTableOfContents([]);
    } finally {
      setLoading(false);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Box className="text-center mb-8">
          <Typography variant="h3" className="flex items-center justify-center gap-4 text-primary font-bold mb-4">
            <FaBook className="text-4xl" />
            Dokumentace
          </Typography>
          <Typography variant="h6" color="textSecondary">
            Kompletní dokumentace aplikace Démonická
          </Typography>
        </Box>
      </motion.div>

      <Grid container spacing={3}>
        {/* Sidebar with document list */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, position: 'sticky', top: 20 }}>
            <Typography variant="h6" gutterBottom>
              Dostupná dokumentace
            </Typography>
            <List>
              {availableDocs.map((doc) => (
                <ListItem key={doc.name} disablePadding>
                  <ListItemButton
                    selected={selectedDoc?.name === doc.name}
                    onClick={() => loadMarkdownFile(doc)}
                  >
                    <ListItemText
                      primary={
                        <Box className="flex items-center gap-2">
                          <FaFileAlt className="text-sm" />
                          {doc.title}
                        </Box>
                      }
                      secondary={doc.description}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Main content area */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, minHeight: '600px' }}>
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
                <Box className="mb-4">
                  <Chip label={selectedDoc.title} color="primary" />
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

        {/* Table of Contents */}
        <Grid item xs={12} md={3}>
          {tableOfContents.length > 0 && (
            <Paper sx={{ p: 2, position: 'sticky', top: 20 }}>
              <Typography variant="h6" gutterBottom>
                Obsah
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List dense>
                {tableOfContents.map((section, index) => (
                  <ListItem key={index} disablePadding>
                    <ListItemButton
                      onClick={() => scrollToSection(section.id)}
                      sx={{ pl: section.level * 2 }}
                    >
                      <ListItemText
                        primary={section.title}
                        primaryTypographyProps={{
                          variant: section.level === 1 ? 'subtitle1' : 'body2',
                          fontWeight: section.level === 1 ? 'bold' : 'normal'
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Container>
  );
}; 