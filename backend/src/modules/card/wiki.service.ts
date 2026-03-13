import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface WikiRandomResponse {
  query: {
    random: {
      title: string;
      id: number;
    }[];
  };
}

export interface WikiSummaryResponse {
  title: string;
  extract: string;
  thumbnail?: {
    source: string;
  };
  pageid: number;
  content_urls: {
    desktop: {
      page: string;
    };
  };
}

export interface ArticleSummary {
  title: string;
  extract: string;
  thumbnail?: string;
  pageid: number;
  content_urls: {
    desktop: {
      page: string;
    };
  };
  pageViews?: number;
  languageCount?: number;
}

interface WikiError {
  response?: {
    status: number;
    data: {
      message: string;
    };
  };
}

@Injectable()
export class WikiService {
  private readonly logger = new Logger(WikiService.name);
  private readonly actionApiUrl: string;
  private readonly userAgent: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.actionApiUrl =
      this.configService.get<string>('WIKIPEDIA_API_URL') || 'https://en.wikipedia.org/w/api.php';
    this.userAgent =
      'WikiGacha/1.0 (https://github.com/wikigacha/wikigacha; contact@wikigacha.com)';
  }

  /**
   * Fetches random article titles from Wikipedia.
   * @param limit Number of articles to fetch.
   * @returns Array of article titles.
   */
  async getRandomArticles(limit: number): Promise<string[]> {
    const params = {
      action: 'query',
      format: 'json',
      list: 'random',
      rnnamespace: 0,
      rnlimit: limit,
      origin: '*',
    };

    try {
      const { data } = await firstValueFrom(
        this.httpService.get<WikiRandomResponse>(this.actionApiUrl, {
          params,
          headers: { 'User-Agent': this.userAgent },
        }),
      );

      if (!data?.query?.random) {
        throw new Error('Invalid response from Wikipedia API');
      }

      return data.query.random.map((article) => article.title);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error fetching random articles: ${message}`);
      throw error;
    }
  }

  /**
   * Fetches a summary for a specific Wikipedia article.
   * Uses the REST API summary endpoint for better performance and clean data.
   * @param title The article title.
   * @returns Article summary data (title, extract, thumbnail, etc.)
   */
  async getArticleSummary(title: string): Promise<ArticleSummary | null> {
    const encodedTitle = encodeURIComponent(title.replace(/ /g, '_'));
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTitle}`;

    try {
      const { data } = await firstValueFrom(
        this.httpService.get<WikiSummaryResponse>(summaryUrl, {
          headers: { 'User-Agent': this.userAgent },
        }),
      );

      return {
        title: data.title,
        extract: data.extract,
        thumbnail: data.thumbnail?.source,
        pageid: data.pageid,
        content_urls: data.content_urls,
      };
    } catch (error) {
      const wikiError = error as WikiError;
      if (wikiError.response?.status === 404) {
        this.logger.warn(`Article not found: ${title}`);
        return null;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error fetching article summary for "${title}": ${message}`);
      throw error;
    }
  }

  /**
   * Fetches article statistics (page views and language count) from Wikipedia.
   * @param title The article title.
   * @returns Page views (last 30 days) and language count.
   */
  async getArticleStats(title: string): Promise<{ pageViews: number; languageCount: number }> {
    const params = {
      action: 'query',
      format: 'json',
      prop: 'pageviews|langlinks',
      titles: title,
      lllimit: 'max',
      pvipdays: 30,
      redirects: 1,
      origin: '*',
    };

    try {
      const { data } = await firstValueFrom(
        this.httpService.get<any>(this.actionApiUrl, {
          params,
          headers: { 'User-Agent': this.userAgent },
        }),
      );

      const pages = data?.query?.pages;
      if (!pages) {
        return { pageViews: 0, languageCount: 0 };
      }

      // Get the first page (there should only be one)
      const pageId = Object.keys(pages)[0];
      const page = pages[pageId];

      if (!page || page.missing === '') {
        return { pageViews: 0, languageCount: 0 };
      }

      // Sum page views for the last 30 days
      const pageViewsMap = page.pageviews || {};
      const totalPageViews = Object.values(pageViewsMap)
        .filter((v): v is number => typeof v === 'number')
        .reduce((sum, count) => sum + count, 0);

      // Count language links
      const languageCount = page.langlinks ? page.langlinks.length : 0;

      return {
        pageViews: totalPageViews,
        languageCount,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error fetching article stats for "${title}": ${message}`);
      return { pageViews: 0, languageCount: 0 };
    }
  }

  /**
   * Fetches global Wikipedia statistics for calibration.
   * Fetches total article count and aggregate pageviews for the last full month.
   */
  async getGlobalStats(): Promise<{ articleCount: number; totalMonthlyViews: number }> {
    try {
      // 1. Get article count
      const statsParams = {
        action: 'query',
        meta: 'siteinfo',
        siprop: 'statistics',
        format: 'json',
        origin: '*',
      };

      const statsRes = await firstValueFrom(
        this.httpService.get<any>(this.actionApiUrl, {
          params: statsParams,
          headers: { 'User-Agent': this.userAgent },
        }),
      );

      const articleCount = statsRes?.query?.statistics?.articles || 7000000;

      // 2. Get aggregate pageviews (monthly)
      // Use the Analytics API. Request the last 3 months to ensure we get at least one full month.
      const today = new Date();
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(today.getMonth() - 2);

      // Start from the beginning of a month to satisfy API granularity
      const start = `${threeMonthsAgo.getFullYear()}${String(threeMonthsAgo.getMonth() + 1).padStart(2, '0')}0100`;
      const end = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}0100`;

      const analyticsUrl = `https://wikimedia.org/api/rest_v1/metrics/pageviews/aggregate/en.wikipedia/all-access/user/monthly/${start}/${end}`;

      const analyticsRes = await firstValueFrom(
        this.httpService.get<any>(analyticsUrl, {
          headers: { 'User-Agent': this.userAgent },
        }),
      );

      // Pick the maximum monthly views from the returned list (usually the last full month)
      const items = analyticsRes?.items || [];
      const viewsList = items.map((item: any) => item.views).filter((v: any) => typeof v === 'number');
      const totalMonthlyViews = viewsList.length > 0 ? Math.max(...viewsList) : 10000000000;

      this.logger.log(`[Global Stats] articleCount=${articleCount}, totalMonthlyViews=${totalMonthlyViews}`);

      return {
        articleCount,
        totalMonthlyViews,
      };
    } catch (error) {
      this.logger.error(`Error fetching global stats: ${error.message}`);
      return { articleCount: 7000000, totalMonthlyViews: 10000000000 };
    }
  }
}
