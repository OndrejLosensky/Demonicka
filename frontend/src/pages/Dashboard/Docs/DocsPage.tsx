import React from 'react';
import { Container, Grid } from '@mui/material';
import '../../../styles/markdown.css';
import { withPageLoader } from '../../../components/hoc/withPageLoader';
import { usePageTitle } from '../../../hooks/usePageTitle';
import { PageHeader } from '../../../components/ui/PageHeader';
import { useDocumentation } from './hooks';
import { DocsSidebar, DocsContent } from './components';

const DocsComponent: React.FC = () => {
  usePageTitle('Dokumentace');
  const {
    selectedDoc,
    expandedCategory,
    markdownContent,
    loading,
    error,
    loadMarkdownFile,
    handleCategoryClick
  } = useDocumentation();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <PageHeader title="Dokumentace" />
      <Grid container spacing={4}>
        {/* Sidebar */}
        <Grid item xs={12} md={3}>
          <DocsSidebar
            selectedDoc={selectedDoc}
            expandedCategory={expandedCategory}
            onCategoryClick={handleCategoryClick}
            onDocClick={loadMarkdownFile}
          />
        </Grid>

        {/* Content */}
        <Grid item xs={12} md={9}>
          <DocsContent
            selectedDoc={selectedDoc}
            markdownContent={markdownContent}
            loading={loading}
            error={error}
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export const Docs = withPageLoader(DocsComponent);
