import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    player: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-token'),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('supersecret'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('guestLogin', () => {
    it('should create a new player if username does not exist', async () => {
      mockPrismaService.player.findUnique.mockResolvedValue(null);
      mockPrismaService.player.create.mockResolvedValue({ id: 'new-id', username: 'Guest' });

      const result = await service.guestLogin('Guest');

      expect(prisma.player.create).toHaveBeenCalled();
      expect(result.player.username).toBe('Guest');
      expect(result.accessToken).toBe('mock-token');
    });

    it('should return existing player if username exists', async () => {
      mockPrismaService.player.findUnique.mockResolvedValue({ id: 'old-id', username: 'Guest' });

      const result = await service.guestLogin('Guest');

      expect(prisma.player.create).not.toHaveBeenCalled();
      expect(result.player.id).toBe('old-id');
    });
  });

  describe('getPlayerById', () => {
    it('should return player by id', async () => {
      mockPrismaService.player.findUnique.mockResolvedValue({ id: 'test-id', username: 'Tester' });

      const result = await service.getPlayerById('test-id');

      expect(result.username).toBe('Tester');
    });
  });

  describe('generateToken', () => {
    it('should return a jwt token', async () => {
      const player = { id: '123', username: 'Tester' };
      const result = await service.generateToken(player);
      expect(result).toBe('mock-token');
      expect(jwtService.sign).toHaveBeenCalled();
    });
  });

  describe('verifyGoogleIdToken', () => {
    it('should verify token and return player data', async () => {
      // Mock OAuth2Client
      const mockPayload = { sub: 'google-123', email: 'test@gmail.com', name: 'Google User' };
      const mockTicket = { getPayload: () => mockPayload };

      // We need to mock the constructor or the prototype
      const { OAuth2Client } = require('google-auth-library');
      jest.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue(mockTicket);

      mockPrismaService.player.findUnique.mockResolvedValue(null);
      mockPrismaService.player.create.mockResolvedValue({ id: 'new-id', username: 'Google User' });

      const result = await service.verifyGoogleIdToken('some-token');

      expect(result.player.username).toBe('Google User');
      expect(result.accessToken).toBe('mock-token');
    });
  });
});
