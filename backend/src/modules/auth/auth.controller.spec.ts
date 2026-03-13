import { Test, TestingModule } from '@nestjs/testing';
import { AuthController, GuestLoginDto } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    guestLogin: jest.fn(),
    getPlayerById: jest.fn(),
    generateToken: jest.fn(),
    verifyGoogleIdToken: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('http://localhost:5173'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('guestLogin', () => {
    it('should call authService.guestLogin', async () => {
      const dto: GuestLoginDto = { username: 'Guest' };
      mockAuthService.guestLogin.mockResolvedValue({ accessToken: 'token', player: {} });
      const result = await controller.guestLogin(dto);
      expect(authService.guestLogin).toHaveBeenCalledWith('Guest');
      expect(result).toHaveProperty('accessToken');
    });
  });

  describe('getProfile', () => {
    it('should return player profile', async () => {
      const req = { user: { userId: '123' } };
      mockAuthService.getPlayerById.mockResolvedValue({ id: '123', username: 'Tester' });
      const result = await controller.getProfile(req);
      expect(authService.getPlayerById).toHaveBeenCalledWith('123');
      expect(result.username).toBe('Tester');
    });
  });
});
