import { useState, useEffect } from 'react';
import { apiClient } from '../../../../utils/apiClient';
import type { DocFile } from './types';
import { DOCUMENTATION_STRUCTURE } from './constants';

export const useDocumentation = () => {
  const [selectedDoc, setSelectedDoc] = useState<DocFile | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string>('getting-started');
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load intro doc by default
  useEffect(() => {
    const introDoc = DOCUMENTATION_STRUCTURE[0].files[0];
    loadMarkdownFile(introDoc);
  }, []);

  const loadMarkdownFile = async (docFile: DocFile) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading doc path:', docFile.path);
      
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

  return {
    selectedDoc,
    expandedCategory,
    markdownContent,
    loading,
    error,
    loadMarkdownFile,
    handleCategoryClick
  };
};
