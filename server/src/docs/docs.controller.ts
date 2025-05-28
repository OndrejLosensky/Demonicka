import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { Public } from '../auth/decorators/public.decorator';

@Controller('v1/docs')
export class DocsController {
  private readonly docsPath = path.join(process.cwd(), 'docs');

  @Public()
  @Get(':filename')
  getDoc(@Param('filename') filename: string, @Res() res: Response) {
    try {
      // Sanitize filename to prevent directory traversal
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9-_.]/g, '');
      const filePath = path.join(this.docsPath, sanitizedFilename);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new NotFoundException(`Documentation file ${filename} not found`);
      }

      // Read and return file content
      const content = fs.readFileSync(filePath, 'utf8');
      
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(content);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(
        `Failed to load documentation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Public()
  @Get()
  listDocs() {
    try {
      const files = fs
        .readdirSync(this.docsPath)
        .filter((file) => file.endsWith('.md'))
        .map((file) => ({
          name: file.replace('.md', ''),
          filename: file,
        }));
      
      return { docs: files };
    } catch {
      return { docs: [] };
    }
  }
} 