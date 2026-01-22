import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface UserMatchInfo {
  id: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
}

export interface MatchResult {
  user: UserMatchInfo | null;
  confidence: number;
}

@Injectable()
export class UserMatchingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Normalize a name for matching
   */
  private normalizeName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics
  }

  /**
   * Calculate simple token-based similarity
   */
  private calculateSimilarity(tokens1: string[], tokens2: string[]): number {
    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);

    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    if (union.size === 0) return 0;

    return intersection.size / union.size;
  }

  /**
   * Tokenize a name into words
   */
  private tokenize(name: string): string[] {
    return name.split(/\s+/).filter((token) => token.length > 0);
  }

  /**
   * Find best matching user for a raw name
   */
  async findBestMatch(rawName: string, eventId?: string): Promise<MatchResult> {
    const normalizedInput = this.normalizeName(rawName);
    const inputTokens = this.tokenize(normalizedInput);

    if (inputTokens.length === 0) {
      return { user: null, confidence: 0 };
    }

    // Get all active users
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        username: true,
      },
    });

    let bestMatch: { user: UserMatchInfo; confidence: number } | null = null;

    for (const user of users) {
      const candidateNames: string[] = [];

      if (user.name) candidateNames.push(user.name);
      if (user.firstName && user.lastName) {
        candidateNames.push(`${user.firstName} ${user.lastName}`);
        candidateNames.push(user.firstName);
        candidateNames.push(user.lastName);
      } else if (user.firstName) candidateNames.push(user.firstName);
      else if (user.lastName) candidateNames.push(user.lastName);
      if (user.username) candidateNames.push(user.username);

      let maxConfidence = 0;

      for (const candidateName of candidateNames) {
        const normalizedCandidate = this.normalizeName(candidateName);
        const candidateTokens = this.tokenize(normalizedCandidate);

        // Exact match
        if (normalizedInput === normalizedCandidate) {
          maxConfidence = Math.max(maxConfidence, 1.0);
          continue;
        }

        // Token-based similarity
        const similarity = this.calculateSimilarity(inputTokens, candidateTokens);
        maxConfidence = Math.max(maxConfidence, similarity);
      }

      // Boost confidence if user attended past events (optional)
      if (eventId && maxConfidence > 0.3) {
        const pastAttendance = await this.prisma.eventUsers.findFirst({
          where: {
            userId: user.id,
            event: {
              id: { not: eventId },
              deletedAt: null,
            },
          },
        });

        if (pastAttendance) {
          maxConfidence = Math.min(1.0, maxConfidence * 1.1); // 10% boost
        }
      }

      if (maxConfidence > 0.3 && (!bestMatch || maxConfidence > bestMatch.confidence)) {
        bestMatch = { user, confidence: maxConfidence };
      }
    }

    return bestMatch
      ? { user: bestMatch.user, confidence: bestMatch.confidence }
      : { user: null, confidence: 0 };
  }
}
