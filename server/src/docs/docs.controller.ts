import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { Public } from '../auth/decorators/public.decorator';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';

@Controller('v1/docs')
export class DocsController {
  private readonly docsPath = path.join(process.cwd(), 'docs');

  @Public()
  @Get()
  listDocs(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<string>> {
    try {
      const allFiles = this.getAllFiles(this.docsPath);
      const total = allFiles.length;
      const skip = paginationDto.skip || 0;
      const take = paginationDto.take || 20;
      const files = allFiles.slice(skip, skip + take);
      const totalPages = Math.ceil(total / take);
      const page = Math.floor(skip / take) + 1;

      return Promise.resolve({
        data: files,
        total,
        page,
        pageSize: take,
        totalPages,
      });
    } catch {
      return Promise.resolve({
        data: [],
        total: 0,
        page: 1,
        pageSize: paginationDto.take || 20,
        totalPages: 0,
      });
    }
  }

  @Public()
  @Get('*filePath')
  getDoc(@Param('filePath') filePath: string, @Res() res: Response) {
    try {
      if (!filePath) {
        throw new NotFoundException('No documentation file specified');
      }

      // First decode the entire path to handle encoded slashes
      const decodedPath = decodeURIComponent(filePath);

      // Remove leading slash if present
      const trimmedPath = decodedPath.startsWith('/') ? decodedPath.slice(1) : decodedPath;
      
      // Sanitize filename to prevent directory traversal
      const sanitizedPath = trimmedPath
        .split('/')
        .map((part) => part.replace(/[^a-zA-Z0-9-_.]/g, ''))
        .join('/');
      
      const fullPath = path.join(this.docsPath, sanitizedPath);
      
      // Check if file exists
      if (!fs.existsSync(fullPath)) {
        throw new NotFoundException(`Documentation file ${filePath} not found`);
      }

      // Read and return file content
      const content = fs.readFileSync(fullPath, 'utf8');
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