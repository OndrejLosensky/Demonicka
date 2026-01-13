import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoggingService } from '../logging/logging.service';
import { UserRole } from '@prisma/client';
import { LeaderboardGateway } from '../leaderboard/leaderboard.gateway';

describe('UsersService', () => {
  let service: UsersService;
  let mockPrismaService: any;
  let mockLoggingService: any;
  let mockLeaderboardGateway: any;

  beforeEach(async () => {
    mockPrismaService = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    mockLoggingService = {
      logUserCreated: jest.fn(),
    };

    mockLeaderboardGateway = {
      emitFullUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: LoggingService,
          useValue: mockLoggingService,
        },
        {
          provide: LeaderboardGateway,
          useValue: mockLeaderboardGateway,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('generateRegisterToken', () => {
    it('should generate username-based token with random number', async () => {
      const mockUser = {
        id: '123',
        username: 'Ondrej',
        role: UserRole.PARTICIPANT,
        isRegistrationComplete: false,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      const result = await service.generateRegisterToken('123');

      expect(result.token).toMatch(/^Ondrej-\d{4}$/);
      expect(result.token.split('-')[0]).toBe('Ondrej');
      expect(result.token.split('-')[1]).toMatch(/^\d{4}$/);
      const number = parseInt(result.token.split('-')[1]);
      expect(number).toBeGreaterThanOrEqual(1000);
      expect(number).toBeLessThanOrEqual(9999);
    });

    it('should generate different tokens for same user', async () => {
      const mockUser = {
        id: '123',
        username: 'Ondrej',
        role: UserRole.PARTICIPANT,
        isRegistrationComplete: false,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      const result1 = await service.generateRegisterToken('123');
      const result2 = await service.generateRegisterToken('123');

      expect(result1.token).not.toBe(result2.token);
      expect(result1.token.split('-')[0]).toBe('Ondrej');
      expect(result2.token.split('-')[0]).toBe('Ondrej');
    });
  });

  describe('createParticipant', () => {
    it('should create participant with username-based token', async () => {
      const createParticipantDto = {
        username: 'TestUser',
        name: 'Test User',
        gender: 'MALE' as const,
      };

      const mockUser = {
        id: '123',
        ...createParticipantDto,
        registrationToken: 'TestUser-1234',
        isRegistrationComplete: false,
        role: UserRole.PARTICIPANT,
        canLogin: false,
        createdBy: null,
        beerCount: 0,
        lastBeerTime: null,
        isTwoFactorEnabled: false,
        twoFactorSecret: null,
        allowedIPs: [],
        lastAdminLogin: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        password: null,
        firstName: null,
        lastName: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null); // Username not taken
      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.createParticipant(createParticipantDto);

      expect(result.registrationToken).toMatch(/^TestUser-\d{4}$/);
      expect(result.role).toBe(UserRole.PARTICIPANT);
      expect(result.isRegistrationComplete).toBe(false);
    });
  });
});
