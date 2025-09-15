export interface MarkdownSection {
  id: string;
  title: string;
  level: number;
  content: string;
}

export class SimpleMarkdownParser {
  static parse(markdown: string): string {
    if (!markdown || typeof markdown !== 'string') {
      console.error('Invalid markdown input:', markdown);
      return '<p>Error: Invalid content</p>';
    }

    let html = markdown;

    // Headers (h1-h6) - more robust matching
    html = html.replace(/^#{1,6}\s+(.+)$/gm, (match, content) => {
      const headerMatch = match.match(/^#+/);
      const level = headerMatch ? headerMatch[0].length : 1;
      const id = content.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return `<h${level} id="${id}">${content}</h${level}>`;
    });

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Code blocks
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Lists - improved handling
    const lines = html.split('\n');
    const processedLines: string[] = [];
    let inList = false;
    let listType = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const listMatch = line.match(/^(\s*)([*-]|\d+\.)\s+(.+)$/);
      
      if (listMatch) {
        const [, , marker, content] = listMatch;
        const currentListType = /^\d+\./.test(marker) ? 'ol' : 'ul';
        
        if (!inList) {
          processedLines.push(`<${currentListType}>`);
          inList = true;
          listType = currentListType;
        } else if (listType !== currentListType) {
          processedLines.push(`</${listType}><${currentListType}>`);
          listType = currentListType;
        }
        
        processedLines.push(`<li>${content}</li>`);
      } else {
        if (inList) {
          processedLines.push(`</${listType}>`);
          inList = false;
        }
        processedLines.push(line);
      }
    }
    
    if (inList) {
      processedLines.push(`</${listType}>`);
    }

    html = processedLines.join('\n');

    // Paragraphs - improved handling
    html = html.replace(/\n\n+/g, '</p><p>');
    html = '<p>' + html + '</p>';

    // Clean up empty paragraphs and fix structure
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>(<h[1-6])/g, '$1');
    html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
    html = html.replace(/<p>(<pre>)/g, '$1');
    html = html.replace(/(<\/pre>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ul>)/g, '$1');
    html = html.replace(/(<\/ul>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ol>)/g, '$1');
    html = html.replace(/(<\/ol>)<\/p>/g, '$1');

    return html;
  }

  static extractTableOfContents(markdown: string): MarkdownSection[] {
    const sections: MarkdownSection[] = [];
    const lines = markdown.split('\n');

    for (const line of lines) {
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const title = headerMatch[2].trim();
        const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        
        sections.push({
          id,
          title,
          level,
          content: line
        });
      }
    }

    return sections;
  }

  static generateId(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
} 