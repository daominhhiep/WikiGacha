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
  qScore?: number;
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
    const start = Date.now();
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

      const duration = Date.now() - start;
      this.logger.debug(`getRandomArticles(${limit}) took ${duration}ms`);
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
    const start = Date.now();
    const encodedTitle = encodeURIComponent(title.replace(/ /g, '_'));
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTitle}`;

    try {
      const { data } = await firstValueFrom(
        this.httpService.get<WikiSummaryResponse>(summaryUrl, {
          headers: { 'User-Agent': this.userAgent },
        }),
      );

      const duration = Date.now() - start;
      this.logger.debug(`getArticleSummary("${title}") took ${duration}ms`);
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
   * Fetches data for multiple articles in a single Wikipedia Action API call.
   * @param titles Array of article titles.
   * @returns Map of article data indexed by title.
   */
  async getBatchArticlesData(titles: string[]): Promise<Record<string, any>> {
    const start = Date.now();
    const params = {
      action: 'query',
      format: 'json',
      prop: 'extracts|pageimages|langlinks|pageassessments|info|pageviews',
      titles: titles.join('|'),
      exintro: 1,
      explaintext: 1,
      exchars: 300,
      piprop: 'thumbnail',
      pithumbsize: 400,
      lllimit: 'max',
      pvipdays: 30, // Get last 30 days of views for popularity stats
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

      const pages = data?.query?.pages || {};
      const results: Record<string, any> = {};

      for (const pageId of Object.keys(pages)) {
        const page = pages[pageId];
        if (page.missing === '') continue;

        // Calculate total views from the pageviews object (sum of last 30 days)
        const viewsObj = page.pageviews || {};
        const totalViews = Object.values(viewsObj)
          .filter((v): v is number => typeof v === 'number')
          .reduce((sum, count) => sum + count, 0);

        results[page.title] = {
          pageid: page.pageid,
          title: page.title,
          extract: page.extract,
          thumbnail: page.thumbnail?.source,
          languageCount: page.langlinks ? page.langlinks.length : 0,
          pageAssessments: page.pageassessments,
          length: page.length || 0,
          pageViews: totalViews,
          content_urls: {
            desktop: {
              page: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
            },
          },
        };
      }

      const duration = Date.now() - start;
      this.logger.debug(`getBatchArticlesData(${titles.length}) took ${duration}ms`);
      return results;
    } catch (error) {
      this.logger.error(`Error fetching batch articles: ${error.message}`);
      return {};
    }
  }

  /**
   * Fetches quality and popularity scores from WikiRank API.
   * @param title The article title.
   * @param lang The language code (default 'en').
   * @returns An object containing quality and popularity scores.
   */
  async getWikiRankScore(title: string, lang: string = 'en'): Promise<{ quality: number; popularity: number }> {
    const start = Date.now();
    const encodedTitle = encodeURIComponent(title.replace(/ /g, '_'));
    const url = `https://api.wikirank.net/api.php?name=${encodedTitle}&lang=${lang}`;
    this.logger.debug(`Fetching WikiRank score: ${url}`);

    try {
      const response = await firstValueFrom(
        this.httpService.get<any>(url, {
          headers: { 'User-Agent': this.userAgent },
        }),
      );

      const result = response?.data?.result?.[lang];
      const duration = Date.now() - start;
      this.logger.debug(`getWikiRankScore("${title}") took ${duration}ms`);
      return {
        quality: typeof result?.quality === 'number' ? result.quality : 0,
        popularity: typeof result?.popularity === 'number' ? result.popularity : 0,
      };
    } catch (error) {
      this.logger.error(`Error fetching WikiRank score for "${title}": ${error.message}`);
      return { quality: 0, popularity: 0 };
    }
  }

  /**
   * Fetches article statistics (page views and language count) from Wikipedia.
   * @param title The article title.
   * @returns Page views (last 12 months), language count, quality assessments and length.
   */
  async getArticleStats(
    title: string,
  ): Promise<{
    pageViews: number;
    languageCount: number;
    pageAssessments?: Record<string, string>;
    length: number;
  }> {
    try {
      // 1. Fetch language count, assessments and length from Action API
      const actionParams = {
        action: 'query',
        format: 'json',
        prop: 'langlinks|pageassessments|info',
        titles: title,
        lllimit: 'max',
        redirects: 1,
        origin: '*',
      };

      const actionRes = await firstValueFrom(
        this.httpService.get<any>(this.actionApiUrl, {
          params: actionParams,
          headers: { 'User-Agent': this.userAgent },
        }),
      );

      const pages = actionRes?.data?.query?.pages;
      let languageCount = 0;
      let pageAssessments: Record<string, string> | undefined;
      let length = 0;

      if (pages) {
        const pageId = Object.keys(pages)[0];
        const page = pages[pageId];
        languageCount = page?.langlinks ? page.langlinks.length : 0;
        pageAssessments = page?.pageassessments;
        length = page?.length || 0;
      }

      // 2. Fetch 12 months of page views from REST API
      const today = new Date();
      const lastYear = new Date();
      lastYear.setFullYear(today.getFullYear() - 1);
      lastYear.setMonth(today.getMonth());

      const start = `${lastYear.getFullYear()}${String(lastYear.getMonth() + 1).padStart(2, '0')}0100`;
      const end = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}0100`;

      const encodedTitle = encodeURIComponent(title.replace(/ /g, '_'));
      const analyticsUrl = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/all-agents/${encodedTitle}/monthly/${start}/${end}`;

      const analyticsRes = await firstValueFrom(
        this.httpService.get<any>(analyticsUrl, {
          headers: { 'User-Agent': this.userAgent },
        }),
      );

      const items = analyticsRes?.data?.items || [];
      const totalPageViews = items
        .map((item: any) => item.views)
        .filter((v: any) => typeof v === 'number')
        .reduce((sum: number, count: number) => sum + count, 0);

      return {
        pageViews: totalPageViews,
        languageCount,
        pageAssessments,
        length,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error fetching article stats for "${title}": ${message}`);
      return { pageViews: 0, languageCount: 0, length: 0 };
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

      const articleCount = statsRes?.data?.query?.statistics?.articles || 7000000;

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
      const items = analyticsRes?.data?.items || [];
      const viewsList = items
        .map((item: any) => item.views)
        .filter((v: any) => typeof v === 'number');
      const totalMonthlyViews = viewsList.length > 0 ? Math.max(...viewsList) : 10000000000;

      this.logger.log(
        `[Global Stats] articleCount=${articleCount}, totalMonthlyViews=${totalMonthlyViews}`,
      );

      return {
        articleCount,
        totalMonthlyViews,
      };
    } catch (error) {
      this.logger.error(`Error fetching global stats: ${error.message}`);
      return { articleCount: 7000000, totalMonthlyViews: 10000000000 };
    }
  }

  /**
   * Fetches a list of top viewed articles for a recent date.
   * @param limit Number of top articles to consider.
   * @returns Array of popular article titles.
   */
  async getTopArticles(limit: number = 100): Promise<string[]> {
    try {
      // Use a date from 2-3 days ago to ensure data is available
      const date = new Date();
      date.setDate(date.getDate() - 3);

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/${year}/${month}/${day}`;

      const { data } = await firstValueFrom(
        this.httpService.get<any>(url, {
          headers: { 'User-Agent': this.userAgent },
        }),
      );

      const articles = data?.items?.[0]?.articles || [];

      // Filter out meta pages like "Main_Page", "Special:Search", etc.
      const filtered = articles
        .filter((a: any) => {
          const title = a.article;
          return (
            !title.includes(':') &&
            title !== 'Main_Page' &&
            title !== 'Search' &&
            !title.startsWith('File:')
          );
        })
        .slice(0, limit)
        .map((a: any) => a.article.replace(/_/g, ' '));

      return filtered;
    } catch (error) {
      this.logger.error(`Error fetching top articles: ${error.message}`);
      return [];
    }
  }
}
