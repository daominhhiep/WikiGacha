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
}
