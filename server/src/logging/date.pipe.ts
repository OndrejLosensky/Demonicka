import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class DatePipe implements PipeTransform<string, Date | undefined> {
  transform(value: string | undefined, metadata: ArgumentMetadata): Date | undefined {
    if (!value) {
      return undefined;
    }
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
  }
} 