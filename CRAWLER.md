# Course Data Crawler Documentation

## Overview

The Course Data Crawler is a comprehensive utility that automatically fetches course and session data from the University of Wisconsin enrollment API and stores it in the database. It includes intelligent caching, rate limiting, auto-term discovery, and robust error handling.

## Architecture

### Components

1. **Course List Crawler** (`courseListCrawler.ts`)
   - Fetches basic course information for a term
   - Makes 2 API calls: count query + full data fetch
   - Returns course metadata (names, IDs, descriptions)

2. **Session List Crawler** (`sessionListCrawler.ts`) 
   - Fetches detailed session data for each course
   - Includes meeting times, instructors, locations
   - More intensive API calls per course

3. **Main Crawler Utility** (`crawlAndUpload.ts`)
   - Orchestrates the entire crawling process
   - Implements rate limiting and metadata checking
   - Handles batch processing for multiple terms
   - Auto-fetches available terms from UW-Madison API

4. **Term Code Crawler** (`termCodeCrawler.ts`)
   - Fetches available term codes from UW-Madison API
   - Filters current/future vs past terms
   - Provides validation and term information utilities

### Database Schema

The crawler maintains several data structures:

- **`course`** - Main course information
- **`session`** - Detailed class session data  
- **`courseListMetaData`** - Tracks when course lists were last updated
- **`sessionListMetaData`** - Tracks session updates per course

## Usage

### Manual Crawling

```bash
# Auto-crawl all available terms (recommended)
npm run crawl:auto

# Auto-crawl including past terms
npm run crawl:auto-all

# Auto-crawl with force update
npm run crawl:auto-force

# List available terms
npm run list-terms

# Crawl specific terms manually
npm run crawl -- --terms 1256,1262

# Force update (ignore metadata cache)
npm run crawl:force

# Debug mode with verbose logging
npm run crawl:debug

# Custom rate limiting
npm run crawl:fast     # 500ms course, 50ms session delays
npm run crawl:slow     # 2000ms course, 300ms session delays

# Local development with emulator
npm run crawl:local
```

### Scheduled Crawling with Cron

```bash
# Set up a cron job to auto-crawl every 12 hours
# Add to crontab (crontab -e):
0 */12 * * * cd /path/to/project && npm run crawl:auto >> /var/log/crawler.log 2>&1

# Or every 6 hours:
0 */6 * * * cd /path/to/project && npm run crawl:auto >> /var/log/crawler.log 2>&1

# Daily at 2 AM:
0 2 * * * cd /path/to/project && npm run crawl:auto >> /var/log/crawler.log 2>&1
```

### Command Line Options

#### Main Crawler (`npm run crawl`)

| Option | Short | Description | Default |
|--------|-------|-------------|---------|   
| `--auto` | - | Auto-fetch available terms from API | `false` |
| `--include-past` | - | Include past terms with --auto | `false` |
| `--terms` | `-t` | Comma-separated term codes | Required if not --auto |
| `--rate-limit` | `-r` | Rate limit between course API calls (ms) | `1000` |
| `--session-rate-limit` | `-sr` | Rate limit between session API calls (ms) | `100` |
| `--force` | `-f` | Force update ignoring metadata | `false` |
| `--validate-terms` | - | Validate terms against API | `false` |
| `--log-level` | `-l` | Logging level: info, debug, error | `info` |
| `--help` | `-h` | Show usage information | - |

#### Term Listing (`npm run list-terms`)

| Option | Description | Default |
|--------|-------------|---------|   
| `--include-past` | Include past terms in listing | `false` |
| `--codes-only` | Show only term codes | `false` |
| `--debug` | Enable debug logging | `false` |

## Features

### Auto-Term Discovery

The crawler can automatically discover available terms:

- **API Integration**: Fetches current term codes from UW-Madison API
- **Smart Filtering**: Excludes past terms by default (configurable)
- **Real-time Updates**: Adapts to new terms without manual configuration
- **Database Safety**: Only processes available terms, leaves others untouched

### Intelligent Metadata Caching

The crawler checks metadata before making API calls to prevent unnecessary work:

- **Course List Metadata**: Tracks when course lists were last updated (12-hour cooldown)
- **Session List Metadata**: Tracks session updates per course with content hashing
- **Hash Comparison**: Only updates data when content actually changes using ServerConfig.hash()

### Compare-Based Database Updates

Instead of delete-all-and-upload, the crawler now uses intelligent comparison:

- **Compare Existing vs New**: Only modifies courses/sessions that have changed
- **Selective Deletion**: Only removes courses/sessions no longer available
- **Upsert Operations**: Database create operations act as upserts in Cosmos DB
- **Preserve Historical Data**: Leaves database records for unavailable terms untouched

### Rate Limiting

Configurable delays between API calls to be respectful to the source API:

- **Course Rate Limiting**: Delay between course list API calls
- **Session Rate Limiting**: Delay between individual session API calls  
- **Adaptive Timing**: Can be adjusted based on API response times

### Error Handling & Recovery

- **Retry Logic**: Exponential backoff retry for failed operations (1s, 2s, 4s delays)
- **Graceful Degradation**: Continues processing other terms if one fails
- **Detailed Error Reporting**: Logs specific failure points
- **Health Checks**: Database connectivity verification

### Comprehensive Logging

Multi-level logging with timestamps:

```
[TERM-CRAWLER 2024-01-15T10:30:45.123Z] INFO  Found 2 available terms to process
[2024-01-15T10:30:45.124Z] INFO  Starting Course Data Crawler
[2024-01-15T10:30:45.125Z] DEBUG Applying rate limit: 1000ms
[2024-01-15T10:30:46.200Z] INFO  Successfully crawled 2847 courses for 1256
```

### Progress Tracking

Real-time statistics during execution:

```
=== CRAWLER EXECUTION SUMMARY ===
Execution time: 245.67 seconds
Terms processed: 2
Total courses processed: 5694
Total sessions processed: 18247
Courses created: 5694
Sessions created: 18247
Errors encountered: 0
```

## Environment Variables

Required environment variables:

```bash
DB_ENDPOINT=https://your-cosmos-db.documents.azure.com:443/
DB_KEY=your-primary-key-here
DB_ID=your-database-name
```

Optional for local development:
```bash
COSMOS_EMULATOR_ENDPOINT=https://localhost:8081
```

## Production Deployment

### Docker Container

The crawler can be containerized for production deployment:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
# Use cron or external scheduler to run crawler
CMD ["crond", "-f"]
```

### Cron Job Setup

Set up automated crawling with cron:

```bash
# Edit crontab
crontab -e

# Add entry for every 12 hours at minute 0
0 */12 * * * cd /path/to/collegemate-api && npm run crawl:auto >> /var/log/crawler.log 2>&1

# Or daily at 3 AM
0 3 * * * cd /path/to/collegemate-api && npm run crawl:auto >> /var/log/crawler.log 2>&1

# View cron logs
tail -f /var/log/crawler.log
```

### Monitoring

Key metrics to monitor:

- **Execution Success Rate**: Should be >95%
- **Data Freshness**: Course lists updated within 12 hours
- **API Response Times**: Monitor for source API issues
- **Database Performance**: Track insertion/update times
- **Error Rates**: Alert on repeated failures

## Troubleshooting

### Common Issues

1. **Database Connection Failures**
   ```bash
   # Test database connectivity
   npm run crawl -- --log-level debug
   ```

2. **API Rate Limiting**
   ```bash
   # Increase delays if getting rate limited
   npm run crawl -- --rate-limit 2000 --session-rate-limit 500
   ```

3. **Memory Issues with Large Terms**
   ```bash
   # Process terms individually
   npm run crawl -- --terms 1256
   npm run crawl -- --terms 1262
   ```

4. **Stale Data Issues**
   ```bash
   # Force full refresh
   npm run crawl:force
   ```

5. **Invalid Term Codes**
   ```bash
   # List available terms
   npm run list-terms
   
   # Validate before crawling
   npm run crawl -- --terms 1256 --validate-terms
   ```

### Debug Mode

Enable detailed logging for troubleshooting:

```bash
npm run crawl:debug
```

This provides:
- API request/response details
- Database operation timing
- Memory usage information
- Detailed error stack traces

## API Source Information

The crawler fetches data from the University of Wisconsin enrollment API:

- **Base URL**: `https://public.enroll.wisc.edu/api/search/v1`
- **Course Search**: POST with term and pagination
- **Session Details**: GET with term/subject/course parameters
- **Terms API**: `https://public.enroll.wisc.edu/api/search/v1/aggregate`
- **Rate Limits**: Approximately 1 request/second recommended
- **Data Format**: JSON responses with nested structures

## Development

### Adding New Data Sources

To add support for additional universities or data sources:

1. Create new crawler functions in `src/functions/crawlers/`
2. Update data types if needed in `src/datatypes/`
3. Modify main crawler to support multiple sources
4. Add configuration options for source selection

### Testing

The crawler includes comprehensive error simulation for testing:

```bash
# Test with various scenarios
npm run crawl -- --terms invalid-term  # Test error handling
npm run crawl:debug  # Test with detailed logging
npm run crawl:local  # Test with local database
npm run list-terms  # Test term discovery
```

### Performance Optimization

For large-scale deployments:

- **Parallel Processing**: Process multiple terms concurrently
- **Chunked Inserts**: Batch database operations
- **Caching Layers**: Add Redis for frequently accessed data
- **Queue Systems**: Use job queues for distributed processing