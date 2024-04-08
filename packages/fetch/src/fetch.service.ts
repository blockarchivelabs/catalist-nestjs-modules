import fetch, { Response } from 'node-fetch';
import { HttpException, Inject, Injectable, Optional } from '@nestjs/common';
import { MiddlewareService } from '@catalist-nestjs/middleware';
import {
  FETCH_GLOBAL_OPTIONS_TOKEN,
  FETCH_GLOBAL_RETRY_DEFAULT_ATTEMPTS,
  FETCH_GLOBAL_RETRY_DEFAULT_BASE_URLS,
  FETCH_GLOBAL_RETRY_DEFAULT_DELAY,
} from './fetch.constants';
import {
  RequestInfo,
  RequestInit,
  FetchModuleOptions,
} from './interfaces/fetch.interface';

@Injectable()
export class FetchService {
  constructor(
    @Optional()
    @Inject(FETCH_GLOBAL_OPTIONS_TOKEN)
    public options: FetchModuleOptions | null,

    private middlewareService: MiddlewareService<Promise<Response>>,
  ) {
    this.options?.middlewares?.forEach((middleware) => {
      middlewareService.use(middleware);
    });
  }

  public async fetchJson<T>(
    url: RequestInfo,
    options?: RequestInit,
  ): Promise<T> {
    const response = await this.wrappedRequest(url, options);
    return await response.json();
  }

  public async fetchText(
    url: RequestInfo,
    options?: RequestInit,
  ): Promise<string> {
    const response = await this.wrappedRequest(url, options);
    return await response.text();
  }

  public async fetchStream(
    url: RequestInfo,
    options?: RequestInit,
  ): Promise<NodeJS.ReadableStream> {
    const response = await this.wrappedRequest(url, options);
    return response.body;
  }

  protected async wrappedRequest(
    url: RequestInfo,
    options?: RequestInit,
  ): Promise<Response> {
    return await this.middlewareService.go(() => this.request(url, options));
  }

  protected async request(
    url: RequestInfo,
    options?: RequestInit,
    attempt = 0,
  ): Promise<Response> {
    attempt++;

    try {
      const baseUrl = this.getBaseUrl(attempt);
      const fullUrl = this.getUrl(baseUrl, url);
      const response = await fetch(fullUrl, options);

      if (!response.ok) {
        const errorBody = await this.extractErrorBody(response);
        throw new HttpException(errorBody, response.status);
      }

      return response;
    } catch (error) {
      const possibleAttempt = this.getRetryAttempts(options);
      if (attempt > possibleAttempt) throw error;

      await this.delay(options);
      return await this.request(url, options, attempt);
    }
  }

  protected async delay(options?: RequestInit): Promise<void> {
    const timeout = this.getDelayTimeout(options);
    if (timeout <= 0) return;
    return new Promise((resolve) => setTimeout(resolve, timeout));
  }

  protected async extractErrorBody(
    response: Response,
  ): Promise<string | Record<string, unknown>> {
    try {
      return await response.json();
    } catch (error) {
      return response.statusText;
    }
  }

  protected getRetryAttempts(options?: RequestInit): number {
    const localAttempts = options?.retryPolicy?.attempts;
    const globalAttempts = this.options?.retryPolicy?.attempts;

    if (localAttempts != null) return localAttempts;
    if (globalAttempts != null) return globalAttempts;
    return FETCH_GLOBAL_RETRY_DEFAULT_ATTEMPTS;
  }

  protected getDelayTimeout(options?: RequestInit): number {
    const localDelay = options?.retryPolicy?.delay;
    const globalDelay = this.options?.retryPolicy?.delay;

    if (localDelay != null) return localDelay;
    if (globalDelay != null) return globalDelay;
    return FETCH_GLOBAL_RETRY_DEFAULT_DELAY;
  }

  protected getBaseUrl(attempt: number) {
    const defaultBaseUrls = FETCH_GLOBAL_RETRY_DEFAULT_BASE_URLS;
    const baseUrls = this.options?.baseUrls ?? defaultBaseUrls;
    if (!baseUrls.length) return null;

    const index = (attempt - 1) % baseUrls.length;
    return baseUrls[index];
  }

  protected getUrl(baseUrl: string | null, url: RequestInfo): RequestInfo {
    if (typeof url !== 'string') return url;
    if (baseUrl == null) return url;
    if (this.isAbsoluteUrl(url)) return url;

    return `${baseUrl}${url}`;
  }

  protected isAbsoluteUrl(url: string): boolean {
    const regexp = new RegExp('^(?:[a-z]+:)?//', 'i');
    return regexp.test(url);
  }
}
