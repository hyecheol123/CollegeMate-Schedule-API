/**
 * Term Code Listing Utility
 *
 * Simple CLI utility to list available term codes from UW-Madison API.
 * This is a standalone script for discovering available terms before running the crawler.
 *
 * @author Generated for crawler infrastructure
 */

import TermCodeCrawler from './functions/crawlers/termCodeCrawler';

/**
 * Print usage information
 */
function printUsage(): void {
  console.log(`
Usage: npm run list-terms [options]

Options:
  --include-past    Include past terms in the listing
  --codes-only      Show only term codes (one per line)
  --debug           Enable debug logging
  -h, --help        Show this help message

Examples:
  npm run list-terms                    # List current/future terms
  npm run list-terms -- --include-past # Include past terms
  npm run list-terms -- --codes-only   # Show only codes
`);
}

/**
 * Parse command line arguments
 */
function parseArguments(): {
  includePastTerms: boolean;
  codesOnly: boolean;
  logLevel: 'info' | 'debug' | 'error';
} {
  const args = process.argv.slice(2);

  const options = {
    includePastTerms: false,
    codesOnly: false,
    logLevel: 'info' as 'info' | 'debug' | 'error',
  };

  for (const arg of args) {
    switch (arg) {
      case '--include-past':
        options.includePastTerms = true;
        break;
      case '--codes-only':
        options.codesOnly = true;
        break;
      case '--debug':
        options.logLevel = 'debug';
        break;
      case '--help':
      case '-h':
        printUsage();
        throw new Error('HELP_REQUESTED');
      default:
        if (arg.startsWith('-')) {
          console.error(`Unknown option: ${arg}`);
          printUsage();
          throw new Error(`Unknown option: ${arg}`);
        }
        break;
    }
  }

  return options;
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  try {
    const options = parseArguments();

    const crawler = new TermCodeCrawler({
      includePastTerms: options.includePastTerms,
      logLevel: options.logLevel,
    });

    if (options.codesOnly) {
      // Just output term codes, one per line
      const termCodes = await crawler.getTermCodes();
      termCodes.forEach(code => console.log(code));
    } else {
      // Full display with descriptions
      await crawler.displayAvailableTerms();
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'HELP_REQUESTED') {
      return; // Help was requested, exit gracefully
    }
    console.error(`Error: ${error}`);
    throw error;
  }
}

// Execute if this file is run directly
if (require.main === module) {
  main();
}

export {main as listTerms};
