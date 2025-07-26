# School Schedule Gathering API

[![Code Style: Google](https://img.shields.io/badge/code%20style-google-blueviolet.svg)](https://github.com/google/gts)

Standalone schedule gathering API for school course management without authentication or user management features.

This API provides course and schedule data management functionality for educational institutions.

## Scripts

Here is the list for supported npm/yarn scripts. These are used to lint, test, build, and run the code.

- `lint`: lint the code
- `lint:fix`: lint the code and try auto-fix
- `build`: compile typescript codes (destination: `dist` directory)
- `clean`: remove the compiled code
- `start`: run the application (Required Environment Variables: DB_ENDPOINT, DB_KEY, DB_ID)
- `test`: Run tests

## Database Setup

This application uses Azure Cosmos DB. For development and testing:

1. **Azure Cosmos DB Emulator**: Install and run the emulator locally
   - [Installation Guide](https://docs.microsoft.com/en-us/azure/cosmos-db/local-emulator?tabs=ssl-netstd21)
   - For Linux environments, manual network configuration may be required

2. **Environment Variables**: Set the following variables:
   - `DB_ENDPOINT`: Cosmos DB endpoint URL
   - `DB_KEY`: Primary access key
   - `DB_ID`: Database name

## Dependencies/Environment

Developed and tested with `Ubuntu 22.04.2 LTS` and `Node v18.16.0`.

To configure the typescript development environment easily, [gts](https://github.com/google/gts) has been used.
Based on the `gts` style rules, I modified some to enforce rules more strictly.
To see the modification, please check [`.eslintrc.json` file](https://github.com/hyecheol123/Collegemate-User-API/blob/main/.eslintrc.json).

This project uses [Azure Cosmos DB](https://docs.microsoft.com/en-us/azure/cosmos-db/introduction) (NoSQL API).

It is NoSQL Database without schema; The stored data will look like the Data Diagram located below.

Data Diagram  
*TBA*
<!-- <div style="text-align:center">
  <img src="img/ERD.png" width="250em">
</div> -->

<details>
  <summary>Click to see configurations of each collection.</summary>

  *To be added*
</details>

[Express](https://expressjs.com/) is a web framework for node.js.
This project used it to develop and maintain APIs more conveniently.

[ajv](https://ajv.js.org/) is used for runtime type checks.

## API Endpoints

### Active Endpoints
- `GET /schedule/available-semesters` - Get available academic terms
- `GET /schedule/course` - Search for courses by term and name

### Security
- **Origin Validation**: Both endpoints require requests to come from the configured webpage origin
- **No Authentication**: No user authentication or JWT tokens required

### Commented Out Endpoints
All other endpoints with full authentication are commented out but preserved in the codebase for future use:
- **Schedule CRUD operations** (with JWT token validation)
- **Course data crawling/updating** (with server admin token validation)
- **Event/session management** (with user ownership validation)
- **Friend-based schedule sharing** (with friend list validation)
- **Application key authentication** (for mobile app access)
- **User ownership controls** (email-based access restrictions)

## Features

- **Course Search**: Search for courses by term code and course name
- **Semester Information**: Get list of available academic terms
- **Origin Protection**: CORS-like protection requiring requests from authorized web origin
- **Simple Integration**: Minimal setup for web-based course lookup
