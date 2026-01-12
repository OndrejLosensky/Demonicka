import { SetMetadata } from '@nestjs/common';

export const VERSIONS_KEY = 'versions';
export const Versions = (...versions: string[]) =>
  SetMetadata(VERSIONS_KEY, versions);
