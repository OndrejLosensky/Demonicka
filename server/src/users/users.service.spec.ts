import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { LoggingService } from '../logging/logging.service';
import { UserRole } from './enums/user-role.enum';

describe('UsersService', () => {
  let service: UsersService;
  let mockRepository: any;
  let mockLoggingService: any;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
      delete: jest.fn(),
    };

    mockLoggingService = {
      logUserCreated: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: LoggingService,
          useValue: mockLoggingService,
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

      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      const result = await service.generateRegisterToken('123');

      expect(result.token).toMatch(/^Ondrej#\d{4}$/);
      expect(result.token.split('#')[0]).toBe('Ondrej');
      expect(result.token.split('#')[1]).toMatch(/^\d{4}$/);
      const number = parseInt(result.token.split('#')[1]);
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

      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      const result1 = await service.generateRegisterToken('123');
      const result2 = await service.generateRegisterToken('123');

      expect(result1.token).not.toBe(result2.token);
      expect(result1.token.split('#')[0]).toBe('Ondrej');
      expect(result2.token.split('#')[0]).toBe('Ondrej');
    });
  });

  describe('createParticipant', () => {
    it('should create participant with username-based token', async () => {
      const createParticipantDto = {
        username: 'TestUser',
        name: 'Test User',
        gender: 'MALE',
      };

      const mockUser = {
        id: '123',
        ...createParticipantDto,
        registrationToken: 'TestUser#1234',
        isRegistrationComplete: false,
        role: UserRole.PARTICIPANT,
      };

      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      const result = await service.createParticipant(createParticipantDto);

      expect(result.registrationToken).toMatch(/^TestUser#\d{4}$/);
      expect(result.role).toBe(UserRole.PARTICIPANT);
      expect(result.isRegistrationComplete).toBe(false);
    });
  });
});
