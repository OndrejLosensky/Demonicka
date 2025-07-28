import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { Public } from '../auth/decorators/public.decorator';

@Controller('v1/docs')
export class DocsController {
  private readonly docsPath = path.join(process.cwd(), 'docs');

  @Public()
  @Get()
  listDocs() {
    try {
      const files = this.getAllFiles(this.docsPath);
      console.log('Available docs:', files);
      return { docs: files };
    } catch {
      return { docs: [] };
    }
  }

  @Public()
  @Get('*path')
  getDoc(@Param('path') filePath: string, @Res() res: Response) {
    try {
      if (!filePath) {
        throw new NotFoundException('No documentation file specified');
      }

      // First decode the entire path to handle encoded slashes
      filePath = decodeURIComponent(filePath);

      // Handle URL encoding issues - replace comma with slash if it looks like a path
      if (filePath.includes(',') && filePath.includes('.md')) {
        filePath = filePath.replace(',', '/');
      }

      // Remove leading slash if present
      filePath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
      
      // Simple sanitization - only allow alphanumeric, dots, hyphens, underscores, and forward slashes
      const sanitizedPath = filePath
        .replace(/[^a-zA-Z0-9-_.\/]/g, '') // Allow forward slashes
        .replace(/\/+/g, '/') // Normalize multiple slashes to single slash
        .replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes
      
      const fullPath = path.join(this.docsPath, sanitizedPath);
      console.log('Full file path:', fullPath);
      
      // Check if file exists
      if (!fs.existsSync(fullPath)) {
        console.error('File not found:', fullPath);
        throw new NotFoundException(`Documentation file ${filePath} not found`);
      }

      // Read and return file content
      const content = fs.readFileSync(fullPath, 'utf8');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(content);
    } catch (error) {
      console.error('Error handling doc request:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(
        `Failed to load documentation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
      const fullPath = path.join(dirPath, file);
      if (fs.statSync(fullPath).isDirectory()) {
        arrayOfFiles = this.getAllFiles(fullPath, arrayOfFiles);
      } else if (file.endsWith('.md')) {
        arrayOfFiles.push(path.relative(this.docsPath, fullPath));
      }
    });
    return arrayOfFiles;
  }
} 