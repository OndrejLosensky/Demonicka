import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { motion } from 'framer-motion';
import { SimpleMarkdownParser } from '../../../../utils/markdownParser';
import type { DocFile } from '../types';

interface DocsContentProps {
  selectedDoc: DocFile | null;
  markdownContent: string;
  loading: boolean;
  error: string | null;
}

export const DocsContent: React.FC<DocsContentProps> = ({
  selectedDoc,
  markdownContent,
  loading,
  error
}) => {
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
  );
};
