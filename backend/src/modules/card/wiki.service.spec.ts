import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { WikiService } from './wiki.service';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { RedisService } from '../../common/redis/redis.service';

describe('WikiService', () => {
  let service: WikiService;
  let httpService: HttpService;
  let redisService: RedisService;

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WikiService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('https://en.wikipedia.org/w/api.php'),
          },
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<WikiService>(WikiService);
    httpService = module.get<HttpService>(HttpService);
    redisService = module.get<RedisService>(RedisService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getArticleSummary', () => {
    const mockSummary = {
      title: 'Article 1',
      extract: 'This is a summary',
      thumbnail: 'image.jpg',
      pageid: 123,
      content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/Article_1' } },
    };

    it('should return cached summary if available', async () => {
      mockRedisService.get.mockResolvedValue(JSON.stringify(mockSummary));

      const result = await service.getArticleSummary('Article 1');
      
      expect(result).toEqual(mockSummary);
      expect(redisService.get).toHaveBeenCalledWith(expect.stringContaining('wiki:summary:Article_1'));
      expect(httpService.get).not.toHaveBeenCalled();
    });

    it('should fetch and cache summary if not in cache', async () => {
      mockRedisService.get.mockResolvedValue(null);
      const mockApiResponse = {
        data: {
          title: 'Article 1',
          extract: 'This is a summary',
          thumbnail: { source: 'image.jpg' },
          pageid: 123,
          content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/Article_1' } },
        },
      };
      jest.spyOn(httpService, 'get').mockReturnValue(of(mockApiResponse as AxiosResponse));

      const result = await service.getArticleSummary('Article 1');

      expect(result).toEqual(mockSummary);
      expect(redisService.set).toHaveBeenCalledWith(
        expect.stringContaining('wiki:summary:Article_1'),
        JSON.stringify(mockSummary),
        'EX',
        expect.any(Number)
      );
    });

    it('should return null if article is not found', async () => {
      mockRedisService.get.mockResolvedValue(null);
      const errorResponse = {
        response: {
          status: 404,
          data: { message: 'Not Found' },
        },
      };
      jest.spyOn(httpService, 'get').mockReturnValue(throwError(() => errorResponse));

      const result = await service.getArticleSummary('Unknown');
      expect(result).toBeNull();
    });
  });

  describe('getArticleStats', () => {
    const mockStats = {
      pageViews: 300,
      languageCount: 3,
      pageAssessments: { enwiki: 'FA' },
      length: 1000,
    };

    it('should return cached stats if available', async () => {
      mockRedisService.get.mockResolvedValue(JSON.stringify(mockStats));

      const result = await service.getArticleStats('Article 1');

      expect(result).toEqual(mockStats);
      expect(redisService.get).toHaveBeenCalledWith(expect.stringContaining('wiki:stats:Article_1'));
      expect(httpService.get).not.toHaveBeenCalled();
    });

    it('should fetch and cache stats if not in cache', async () => {
      mockRedisService.get.mockResolvedValue(null);
      
      const mockActionResponse = {
        data: {
          query: {
            pages: {
              '123': {
                pageid: 123,
                title: 'Article 1',
                langlinks: [{}, {}, {}],
                pageassessments: { enwiki: 'FA' },
                length: 1000,
              },
            },
          },
        },
      };

      const mockAnalyticsResponse = {
        data: {
          items: [{ views: 100 }, { views: 200 }],
        },
      };

      jest.spyOn(httpService, 'get')
        .mockReturnValueOnce(of(mockActionResponse as AxiosResponse))
        .mockReturnValueOnce(of(mockAnalyticsResponse as AxiosResponse));

      const result = await service.getArticleStats('Article 1');

      expect(result).toEqual(mockStats);
      expect(redisService.set).toHaveBeenCalledWith(
        expect.stringContaining('wiki:stats:Article_1'),
        JSON.stringify(mockStats),
        'EX',
        expect.any(Number)
      );
    });
  });

  describe('getGlobalStats', () => {
    it('should return cached global stats if available', async () => {
      const mockGlobalStats = { articleCount: 7000000, totalMonthlyViews: 10000000000 };
      mockRedisService.get.mockResolvedValue(JSON.stringify(mockGlobalStats));

      const result = await service.getGlobalStats();

      expect(result).toEqual(mockGlobalStats);
      expect(redisService.get).toHaveBeenCalledWith('wiki:global_stats');
    });
  });
});
