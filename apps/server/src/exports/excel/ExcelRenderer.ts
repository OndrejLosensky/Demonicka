import * as ExcelJS from 'exceljs';
import type { Worksheet } from 'exceljs';
import { PassThrough } from 'stream';
import { StreamableFile } from '@nestjs/common';

export type ExcelCellValue =
  | string
  | number
  | boolean
  | Date
  | null
  | undefined;

export interface ExcelColumn<Row> {
  header: string;
  key: string;
  width?: number;
  value: (row: Row) => ExcelCellValue;
  numFmt?: string;
}

export interface AddTableSheetOptions<Row> {
  name: string;
  columns: ExcelColumn<Row>[];
  rows: Row[];
  freezeHeader?: boolean;
  autoFilter?: boolean;
}

export class ExcelRenderer {
  static readonly XLSX_MIME =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  /** Excel worksheet hard limit */
  static readonly MAX_SHEET_ROWS = 1_048_576;
  /** Leave one row for header */
  static readonly MAX_DATA_ROWS = ExcelRenderer.MAX_SHEET_ROWS - 1;

  private workbook: ExcelJS.Workbook;

  constructor() {
    this.workbook = new ExcelJS.Workbook();
    this.workbook.creator = 'Demonicka';
    this.workbook.created = new Date();
  }

  getWorkbook(): ExcelJS.Workbook {
    return this.workbook;
  }

  addSheet(name: string): Worksheet {
    return this.workbook.addWorksheet(this.safeSheetName(name));
  }

  addTableSheet<Row>(options: AddTableSheetOptions<Row>): Worksheet {
    const {
      name,
      columns,
      rows,
      freezeHeader = true,
      autoFilter = true,
    } = options;

    const worksheet = this.addSheet(name);

    worksheet.columns = columns.map((c) => ({
      header: c.header,
      key: c.key,
      width: c.width ?? Math.max(10, Math.min(60, c.header.length + 2)),
    }));

    // Header styling
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: 'middle' };

    // Data
    for (const row of rows) {
      worksheet.addRow(
        Object.fromEntries(columns.map((c) => [c.key, c.value(row)])),
      );
    }

    // Column formatting
    columns.forEach((c, idx) => {
      if (c.numFmt) {
        worksheet.getColumn(idx + 1).numFmt = c.numFmt;
      }
    });

    if (freezeHeader) {
      worksheet.views = [{ state: 'frozen', ySplit: 1 }];
    }

    if (autoFilter) {
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: columns.length },
      };
    }

    return worksheet;
  }

  /**
   * Create multiple sheets for a large table (row limit safe).
   *
   * - namePrefix: `Beer_log` -> sheets `Beer_log_1`, `Beer_log_2`, ...
   * - If rows fit, still uses `_1` to keep behavior predictable.
   */
  addPagedTableSheets<Row>(options: {
    namePrefix: string;
    columns: ExcelColumn<Row>[];
    rows: Row[];
    freezeHeader?: boolean;
    autoFilter?: boolean;
  }): Worksheet[] {
    const {
      namePrefix,
      columns,
      rows,
      freezeHeader = true,
      autoFilter = true,
    } = options;

    const pages: Worksheet[] = [];
    const pageSize = ExcelRenderer.MAX_DATA_ROWS;

    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    for (let page = 0; page < totalPages; page++) {
      const slice = rows.slice(page * pageSize, (page + 1) * pageSize);
      pages.push(
        this.addTableSheet({
          name: `${namePrefix}_${page + 1}`,
          columns,
          rows: slice,
          freezeHeader,
          autoFilter,
        }),
      );
    }

    return pages;
  }

  async writeBuffer(): Promise<Buffer> {
    const arrayBuffer = await this.workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer as ArrayBuffer);
  }

  /**
   * Produces a `StreamableFile` while writing the XLSX into a PassThrough stream.
   * Note: For very large exports you may still want exceljs streaming writer,
   * but this already allows HTTP streaming without holding the final XLSX in memory.
   */
  toStreamableFile(filename: string): StreamableFile {
    const stream = new PassThrough();
    void this.workbook.xlsx
      .write(stream)
      .then(() => stream.end())
      .catch((err) => stream.destroy(err));

    return new StreamableFile(stream, {
      type: ExcelRenderer.XLSX_MIME,
      disposition: `attachment; filename="${filename}"`,
    });
  }

  safeFileName(base: string): string {
    const trimmed = base.trim() || 'export';
    const sanitized = trimmed.replace(/[^a-zA-Z0-9._-]+/g, '_');
    return sanitized.replace(/^_+|_+$/g, '') || 'export';
  }

  safeSheetName(name: string): string {
    // Excel sheet name rules: max 31 chars, cannot contain: : \ / ? * [ ]
    const cleaned = name.replace(/[:\\/?*[\]]/g, '_').trim();
    const fallback = cleaned.length ? cleaned : 'Sheet';
    return fallback.slice(0, 31);
  }
}
