import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { WikiService } from './wiki.service';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';

describe('WikiService', () => {
  let service: WikiService;
  let httpService: HttpService;

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
      ],
    }).compile();

    service = module.get<WikiService>(WikiService);
    httpService = module.get<HttpService>(HttpService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getArticleSummary', () => {
    const mockSummary = {
      title: 'Article 1',
      extract: 'This is a summary',
      thumbnail: { source: 'image.jpg' },
      pageid: 123,
      content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/Article_1' } },
    };

    it('should fetch summary from Wikipedia API', async () => {
      const mockApiResponse = {
        data: mockSummary,
      };
      jest.spyOn(httpService, 'get').mockReturnValue(of(mockApiResponse as AxiosResponse));

      const result = await service.getArticleSummary('Article 1');

      expect(result).toEqual({
        title: mockSummary.title,
        extract: mockSummary.extract,
        thumbnail: mockSummary.thumbnail.source,
        pageid: mockSummary.pageid,
        content_urls: mockSummary.content_urls,
      });
      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining('/page/summary/Article_1'),
        expect.any(Object),
      );
    });

    it('should return null if article is not found', async () => {
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

  describe('getRandomArticles', () => {
    it('should fetch random article titles', async () => {
      const mockResponse = {
        data: {
          query: {
            random: [{ title: 'Random 1' }, { title: 'Random 2' }],
          },
        },
      };
      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse as AxiosResponse));

      const result = await service.getRandomArticles(2);

      expect(result).toEqual(['Random 1', 'Random 2']);
      expect(httpService.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ params: expect.objectContaining({ list: 'random' }) }),
      );
    });
  });

  describe('getBatchArticlesData', () => {
    it('should fetch data for multiple articles', async () => {
      const mockResponse = {
        data: {
          query: {
            pages: {
              '1': { pageid: 1, title: 'A', extract: 'Ext A', pageviews: { '2024-01-01': 10 } },
              '2': { pageid: 2, title: 'B', extract: 'Ext B', pageviews: { '2024-01-01': 20 } },
            },
          },
        },
      };
      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse as AxiosResponse));

      const result = await service.getBatchArticlesData(['A', 'B']);

      expect(result['A']).toBeDefined();
      expect(result['B']).toBeDefined();
      expect(result['A'].pageViews).toBe(10);
    });
  });

  describe('getWikiRankScore', () => {
    it('should fetch scores from WikiRank', async () => {
      const mockResponse = {
        data: {
          result: {
            en: { quality: 85, popularity: 90 },
          },
        },
      };
      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse as AxiosResponse));

      const result = await service.getWikiRankScore('Article');

      expect(result).toEqual({ quality: 85, popularity: 90 });
    });
  });

  describe('getTopArticles', () => {
    it('should fetch top articles from Wikimedia', async () => {
      const mockResponse = {
        data: {
          items: [
            {
              articles: [
                { article: 'Main_Page', views: 1000 },
                { article: 'Popular_Article', views: 500 },
              ],
            },
          ],
        },
      };
      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse as AxiosResponse));

      const result = await service.getTopArticles(10);

      expect(result).toContain('Popular Article');
      expect(result).not.toContain('Main Page');
    });
  });

  describe('getArticleStats', () => {
    it('should fetch stats from Wikipedia APIs', async () => {
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

      jest
        .spyOn(httpService, 'get')
        .mockReturnValueOnce(of(mockActionResponse as AxiosResponse))
        .mockReturnValueOnce(of(mockAnalyticsResponse as AxiosResponse));

      const result = await service.getArticleStats('Article 1');

      expect(result).toEqual({
        pageViews: 300,
        languageCount: 3,
        pageAssessments: { enwiki: 'FA' },
        length: 1000,
      });
    });
  });

  describe('getGlobalStats', () => {
    it('should fetch global stats from Wikipedia APIs', async () => {
      const mockStatsRes = {
        data: {
          query: {
            statistics: {
              articles: 7000000,
            },
          },
        },
      };

      const mockAnalyticsRes = {
        data: {
          items: [{ views: 10000000000 }],
        },
      };

      jest
        .spyOn(httpService, 'get')
        .mockReturnValueOnce(of(mockStatsRes as AxiosResponse))
        .mockReturnValueOnce(of(mockAnalyticsRes as AxiosResponse));

      const result = await service.getGlobalStats();

      expect(result).toEqual({
        articleCount: 7000000,
        totalMonthlyViews: 10000000000,
      });
    });
  });
});
