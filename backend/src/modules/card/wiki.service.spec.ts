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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRandomArticles', () => {
    it('should return a list of random article titles', async () => {
      const mockResponse = {
        data: {
          query: {
            random: [{ title: 'Article 1' }, { title: 'Article 2' }],
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} as any },
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse as AxiosResponse));

      const result = await service.getRandomArticles(2);
      expect(result).toEqual(['Article 1', 'Article 2']);
      expect(httpService.get).toHaveBeenCalledWith(
        'https://en.wikipedia.org/w/api.php',
        expect.objectContaining({
          params: expect.objectContaining({ action: 'query' }),
        }),
      );
    });

    it('should throw an error if the API call fails', async () => {
      jest.spyOn(httpService, 'get').mockReturnValue(throwError(() => new Error('API Error')));
      await expect(service.getRandomArticles(2)).rejects.toThrow('API Error');
    });
  });

  describe('getArticleSummary', () => {
    it('should return article summary data', async () => {
      const mockResponse = {
        data: {
          title: 'Article 1',
          extract: 'This is a summary',
          thumbnail: { source: 'image.jpg' },
          pageid: 123,
          content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/Article_1' } },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} as any },
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse as AxiosResponse));

      const result = await service.getArticleSummary('Article 1');
      expect(result).toEqual({
        title: 'Article 1',
        extract: 'This is a summary',
        thumbnail: 'image.jpg',
        pageid: 123,
        content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/Article_1' } },
      });
      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/rest_v1/page/summary/Article_1'),
        expect.any(Object),
      );
    });

    it('should return null if the article is not found', async () => {
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
    it('should return article stats (page views and language count)', async () => {
      const mockResponse = {
        data: {
          query: {
            pages: {
              '123': {
                pageid: 123,
                title: 'Article 1',
                pageviews: {
                  '2024-03-01': 100,
                  '2024-03-02': 200,
                },
                langlinks: [{}, {}, {}],
              },
            },
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} as any },
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse as AxiosResponse));

      const result = await service.getArticleStats('Article 1');
      expect(result).toEqual({
        pageViews: 300,
        languageCount: 3,
      });
      expect(httpService.get).toHaveBeenCalledWith(
        'https://en.wikipedia.org/w/api.php',
        expect.objectContaining({
          params: expect.objectContaining({
            action: 'query',
            prop: 'pageviews|langlinks',
            titles: 'Article 1',
          }),
        }),
      );
    });

    it('should return zeros if the article is missing', async () => {
      const mockResponse = {
        data: {
          query: {
            pages: {
              '-1': {
                missing: '',
              },
            },
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} as any },
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse as AxiosResponse));

      const result = await service.getArticleStats('NonExistent');
      expect(result).toEqual({ pageViews: 0, languageCount: 0 });
    });
  });
});
