/**
 * Term Code Crawler - Fetches available term codes from UW-Madison API
 *
 * This utility fetches the list of available term codes from the University of Wisconsin
 * enrollment API to discover current and future terms available for course data crawling.
 *
 * @author Generated for crawler infrastructure
 */

import * as https from 'https';

/**
 * Interface for term information from UW-Madison API
 */
export interface TermInfo {
  termCode: string;
  shortDescription: string;
  longDescription: string;
  beginDate: number;
  endDate: number;
  instructionBeginDate: number;
  instructionEndDate: number;
  academicYear: string;
  pastTerm: boolean;
}

/**
 * Interface for the API response structure
 */
interface TermsApiResponse {
  terms: TermInfo[];
  subjects: Record<string, any>;
}

/**
 * Configuration options for term code crawler
 */
export interface TermCrawlerOptions {
  includePastTerms?: boolean;
  logLevel?: 'info' | 'debug' | 'error';
  timeout?: number; // Request timeout in milliseconds
}

/**
 * Term Code Crawler Class
 */
export class TermCodeCrawler {
  private static readonly API_URL =
    'https://public.enroll.wisc.edu/api/search/v1/aggregate';
  private options: Required<TermCrawlerOptions>;

  constructor(options: TermCrawlerOptions = {}) {
    this.options = {
      includePastTerms: false,
      logLevel: 'info',
      timeout: 10000,
      ...options,
    };
  }

  /**
   * Log messages with level filtering
   */
  private log(level: 'info' | 'debug' | 'error', message: string): void {
    if (
      (this.options.logLevel === 'error' && level !== 'error') ||
      (this.options.logLevel === 'info' && level === 'debug')
    ) {
      return;
    }

    const timestamp = new Date().toISOString();
    const levelStr = level.toUpperCase().padEnd(5);
    console.log(`[TERM-CRAWLER ${timestamp}] ${levelStr} ${message}`);
  }

  /**
   * Fetch available term codes from UW-Madison API
   */
  async fetchTermCodes(): Promise<TermInfo[]> {
    return new Promise((resolve, reject) => {
      this.log('info', 'Fetching available term codes from UW-Madison API...');

      const request = https.get(TermCodeCrawler.API_URL, (res: any) => {
        let data = '';

        res.on('data', (chunk: any) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const response: TermsApiResponse = JSON.parse(data);
            let terms = response.terms;

            if (!this.options.includePastTerms) {
              const originalCount = terms.length;
              terms = terms.filter(term => !term.pastTerm);
              this.log(
                'debug',
                `Filtered out ${originalCount - terms.length} past terms`
              );
            }

            this.log('info', `Successfully fetched ${terms.length} term codes`);
            this.log(
              'debug',
              `Terms: ${terms
                .map(t => `${t.termCode} (${t.shortDescription})`)
                .join(', ')}`
            );

            resolve(terms);
          } catch (error) {
            const errorMsg = `Failed to parse terms API response: ${error}`;
            this.log('error', errorMsg);
            reject(new Error(errorMsg));
          }
        });
      });

      request.on('error', (error: any) => {
        const errorMsg = `Failed to fetch terms from API: ${error}`;
        this.log('error', errorMsg);
        reject(new Error(errorMsg));
      });

      request.setTimeout(this.options.timeout, () => {
        request.destroy();
        const errorMsg = `Request timeout after ${this.options.timeout}ms`;
        this.log('error', errorMsg);
        reject(new Error(errorMsg));
      });
    });
  }

  /**
   * Get term codes only (array of strings)
   */
  async getTermCodes(): Promise<string[]> {
    const terms = await this.fetchTermCodes();
    return terms.map(term => term.termCode);
  }

  /**
   * Get current/future terms only
   */
  async getCurrentTerms(): Promise<TermInfo[]> {
    const terms = await this.fetchTermCodes();
    return terms.filter(term => !term.pastTerm);
  }

  /**
   * Get a specific term by term code
   */
  async getTermByCode(termCode: string): Promise<TermInfo | null> {
    const terms = await this.fetchTermCodes();
    return terms.find(term => term.termCode === termCode) || null;
  }

  /**
   * Check if a term code is valid and available
   */
  async isValidTermCode(termCode: string): Promise<boolean> {
    try {
      const term = await this.getTermByCode(termCode);
      return term !== null;
    } catch (error) {
      this.log('error', `Failed to validate term code ${termCode}: ${error}`);
      return false;
    }
  }

  /**
   * Display available terms in a formatted way
   */
  async displayAvailableTerms(): Promise<void> {
    try {
      const terms = await this.fetchTermCodes();

      console.log('\n' + '='.repeat(80));
      console.log('AVAILABLE TERM CODES');
      console.log('='.repeat(80));

      if (terms.length === 0) {
        console.log('No terms found.');
        return;
      }

      // Group by academic year
      const groupedTerms = terms.reduce(
        (acc, term) => {
          if (!acc[term.academicYear]) {
            acc[term.academicYear] = [];
          }
          acc[term.academicYear].push(term);
          return acc;
        },
        {} as Record<string, TermInfo[]>
      );

      Object.keys(groupedTerms)
        .sort()
        .forEach(academicYear => {
          console.log(`\n${academicYear}:`);
          groupedTerms[academicYear].forEach(term => {
            const status = term.pastTerm ? '[PAST]' : '[CURRENT/FUTURE]';
            const padding = ' '.repeat(Math.max(0, 8 - term.termCode.length));
            console.log(
              `  ${term.termCode}${padding} - ${term.longDescription} ${status}`
            );
          });
        });

      console.log('='.repeat(80));
    } catch (error) {
      this.log('error', `Failed to display available terms: ${error}`);
      throw error;
    }
  }
}

/**
 * Convenience function to quickly fetch term codes
 */
export async function getAvailableTermCodes(
  options?: TermCrawlerOptions
): Promise<string[]> {
  const crawler = new TermCodeCrawler(options);
  return crawler.getTermCodes();
}

/**
 * Convenience function to quickly fetch term information
 */
export async function getAvailableTerms(
  options?: TermCrawlerOptions
): Promise<TermInfo[]> {
  const crawler = new TermCodeCrawler(options);
  return crawler.fetchTermCodes();
}

/**
 * Convenience function to validate a term code
 */
export async function validateTermCode(termCode: string): Promise<boolean> {
  const crawler = new TermCodeCrawler({logLevel: 'error'}); // Suppress logs for validation
  return crawler.isValidTermCode(termCode);
}

export default TermCodeCrawler;
