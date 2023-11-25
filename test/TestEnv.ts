/**
 * Setup test environment
 *  - Setup Database for testing
 *  - Build table that will be used during the testing
 *  - Setup express server
 *
 * Teardown test environment after test
 *  - Remove used table and close database connection from the express server
 *
 * @author Hyecheol (Jerry) Jang <hyecheol123@gmail.com>
 */

import * as crypto from 'crypto';
import * as Cosmos from '@azure/cosmos';
import TestConfig from './TestConfig';
import ExpressServer from '../src/ExpressServer';
import CourseListMetaData from '../src/datatypes/courseListMetaData/CourseListMetaData';

/**
 * Class for Test Environment
 */
export default class TestEnv {
  testConfig: TestConfig; // Configuration Object (to use hash function later)
  expressServer: ExpressServer | undefined; // Express Server Object
  dbClient: Cosmos.Database | undefined; // DB Client Object
  dbIdentifier: string; // unique identifier string for the database

  /**
   * Constructor for TestEnv
   *  - Setup express server
   *  - Setup db client
   *
   * @param identifier Identifier to specify the test
   */
  constructor(identifier: string) {
    // Hash identifier to create new identifier string
    this.dbIdentifier = crypto
      .createHash('md5')
      .update(identifier)
      .digest('hex');

    // Generate TestConfig obj
    this.testConfig = new TestConfig(this.dbIdentifier);
  }

  /**
   * beforeEach test case, run this function
   * - Setup Database for testing
   * - Build table that will be used during the testing
   */
  async start(): Promise<void> {
    // Setup DB
    const dbClient = new Cosmos.CosmosClient({
      endpoint: this.testConfig.db.endpoint,
      key: this.testConfig.db.key,
    });
    const dbOps = await dbClient.databases.create({
      id: this.testConfig.db.databaseId,
    });
    /* istanbul ignore next */
    if (dbOps.statusCode !== 201) {
      throw new Error(JSON.stringify(dbOps));
    }
    this.dbClient = dbClient.database(this.testConfig.db.databaseId);

    // TODO: Setup Containers
    //create a COURSE_LIST_META_DATA container
    const containerOps = await this.dbClient.containers.create({
      id: 'courseListMetaData',
      indexingPolicy: {
        indexingMode: 'consistent',
        automatic: true,
        includedPaths: [{path: '/*'}],
        excludedPaths: [
          {
            path: '/"_etag"/?',
          },
        ],
      },
    });

    /* istanbul ignore next */
    if (containerOps.statusCode !== 201) {
      throw new Error(JSON.stringify(containerOps));
    }

    const courseListMetaDataSample: CourseListMetaData[] = [];
    courseListMetaDataSample.push(
      {
        termCode: '1234',
        hash: 'hash',
        lastChecked: new Date().toISOString(),
      },
      {
        termCode: '5678',
        hash: 'hash',
        lastChecked: new Date().toISOString(),
      },
      {
        termCode: '9012',
        hash: 'hash',
        lastChecked: new Date().toISOString(),
      }
    );

    for (const courseListMetaData of courseListMetaDataSample) {
      await this.dbClient
        .container('courseListMetaData')
        .items.create(courseListMetaData);
    }

    // Setup Express Server
    this.expressServer = new ExpressServer(this.testConfig);
  }

  /**
   * Teardown test environment after test
   *  - Remove used resources (DB)
   *  - close database/redis connection from the express server
   */
  async stop(): Promise<void> {
    // Drop database
    await (this.dbClient as Cosmos.Database).delete();

    // Close database connection of the express server
    await (this.expressServer as ExpressServer).closeServer();

    // Close database connection used during tests
    await (this.dbClient as Cosmos.Database).client.dispose();
  }
}
