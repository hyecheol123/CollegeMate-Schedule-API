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
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

import * as crypto from 'crypto';
import * as Cosmos from '@azure/cosmos';
import TestConfig from './TestConfig';
import ExpressServer from '../src/ExpressServer';
import CourseListMetaData from '../src/datatypes/courseListMetaData/CourseListMetaData';
import Course from '../src/datatypes/course/Course';
import Session from '../src/datatypes/session/Session';
import * as session000441 from './testData/session1242-112-000441.json';
import * as session004289 from './testData/session1242-266-004289.json';
import * as session000803 from './testData/session1244-156-000803.json';
import * as session024684 from './testData/session1244-180-024684.13.json';

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

    // course container
    let containerOps = await this.dbClient.containers.create({
      id: 'course',
      indexingPolicy: {
        indexingMode: 'consistent',
        automatic: true,
        includedPaths: [{path: '/*'}],
        excludedPaths: [
          {path: '/subjectCode/?'},
          {path: '/description/?'},
          {path: '/fullCourseName/?'},
          {path: '/title/?'},
          {path: '/"_etag"/?'},
        ],
      },
    });
    /* istanbul ignore next */
    if (containerOps.statusCode !== 201) {
      throw new Error(JSON.stringify(containerOps));
    }
    // Create a new course entries
    const course1242: Course[] = [
      {
        id: '1242-000441',
        courseName: 'BSE 1',
        courseId: '000441',
        subjectCode: '112',
        description:
          'Full-time off-campus work experience which combines classroom theory with practical knowledge of operations to provide a background upon which to base a professional career. ',
        fullCourseName: 'BIOLOGICAL SYSTEMS ENGINEERING 1',
        termCode: '1242',
        title: 'Cooperative Education Program',
      },
      {
        id: '1242-004289',
        courseName: 'COMP SCI 577',
        courseId: '004289',
        subjectCode: '266',
        description:
          'Basic paradigms for the design and analysis of efficient algorithms: greed, divide-and-conquer, dynamic programming, reductions, and the use of randomness. Computational intractability including typical NP-complete problems and ways to deal with them. ',
        fullCourseName: 'COMPUTER SCIENCES 577',
        termCode: '1242',
        title: 'Introduction to Algorithms',
      },
    ];
    const course1244: Course[] = [
      new Course(
        '1244-000803',
        'ANTHRO 102',
        '000803',
        '156',
        'Introduction to the ancient world from origins of human culture to the beginnings of written history as revealed by archaeological research at great sites and ruins around the globe. Archaeological analyses of important sites as case studies to illustrate concepts and techniques used by archaeologists in their efforts to understand the diversity of the human past. ',
        'ANTHROPOLOGY 102',
        '1244',
        'Archaeology and the Prehistoric World'
      ),
      new Course(
        '1244-024684.13',
        'ART HIST 103',
        '024684.13',
        '180',
        'Offers an introduction to world art by taking a thematic approach. Topics will center around art and architecture produced in a variety of media, from a wide time span, and a range of cultural and geographic points of origin. ',
        'ART HISTORY 103',
        '1244',
        'Intro to Curatorial Studies'
      ),
    ];
    const courseSample: Course[] = [];
    course1242.forEach(course => {
      courseSample.push(course);
    });
    course1244.forEach(course => {
      courseSample.push(course);
    });
    // Create a new course entries on test DB
    for (let index = 0; index < courseSample.length; ++index) {
      await this.dbClient.container('course').items.create(courseSample[index]);
    }

    // courseListMetaData container
    containerOps = await this.dbClient.containers.create({
      id: 'courseListMetaData',
      indexingPolicy: {
        indexingMode: 'consistent',
        automatic: true,
        includedPaths: [{path: '/*'}],
        excludedPaths: [
          {path: '/hash/?'},
          {path: '/lastChecked/?'},
          {path: '/"_etag"/?'},
        ],
      },
    });
    /* istanbul ignore next */
    if (containerOps.statusCode !== 201) {
      throw new Error(JSON.stringify(containerOps));
    }
    // Create a new courseListMetaData entries
    const courseListMetaDataSample: CourseListMetaData[] = [];
    const currentTime = new Date().toISOString();
    let courseListHash = TestConfig.hash(
      '1242',
      '1242',
      JSON.stringify(course1242)
    );
    courseListMetaDataSample.push(
      new CourseListMetaData('1242', courseListHash, currentTime)
    );
    courseListHash = TestConfig.hash(
      '1244',
      '1244',
      JSON.stringify(course1244)
    );
    courseListMetaDataSample.push(
      new CourseListMetaData('1244', courseListHash, currentTime)
    );
    // Create a new courseListMetaData entries on test DB
    for (let index = 0; index < courseListMetaDataSample.length; ++index) {
      await this.dbClient
        .container('courseListMetaData')
        .items.create(courseListMetaDataSample[index]);
    }

    // session container
    containerOps = await this.dbClient.containers.create({
      id: 'session',
      indexingPolicy: {
        indexingMode: 'consistent',
        automatic: true,
        includedPaths: [{path: '/*'}],
        excludedPaths: [
          {path: '/meetings/buildingName/?'},
          {path: '/meetings/room/?'},
          {path: '/meetings/meetingDaysList/?'},
          {path: '/meetings/startTime/*'},
          {path: '/meetings/endTime/*'},
          {path: '/meetings/instructors/?'},
          {path: '/"_etag"/?'},
        ],
      },
    });
    /* istanbul ignore next */
    if (containerOps.statusCode !== 201) {
      throw new Error(JSON.stringify(containerOps));
    }
    // imported session data from json files /src/test/testData
    const sessionSample: Session[] = [];
    session000441.forEach(session => {
      sessionSample.push(session);
    });
    session004289.forEach(session => {
      sessionSample.push(session);
    });
    session000803.forEach(session => {
      sessionSample.push(session);
    });
    session024684.forEach(session => {
      sessionSample.push(session);
    });
    // Create a new session entries on test DB
    for (let index = 0; index < sessionSample.length; ++index) {
      await this.dbClient
        .container('session')
        .items.create(sessionSample[index]);
    }

    // sessionListMetaData container
    containerOps = await this.dbClient.containers.create({
      id: 'sessionListMetaData',
      indexingPolicy: {
        indexingMode: 'consistent',
        automatic: true,
        includedPaths: [{path: '/*'}],
        excludedPaths: [{path: '/hash/?'}, {path: '/"_etag"/?'}],
      },
    });
    /* istanbul ignore next */
    if (containerOps.statusCode !== 201) {
      throw new Error(JSON.stringify(containerOps));
    }
    // Create a new sessionListMetaData entries
    const sessionListMetaDataSample: CourseListMetaData[] = [];
    let sessionListHash = TestConfig.hash(
      '1242',
      '000441',
      JSON.stringify(session000441)
    );
    sessionListMetaDataSample.push(
      new CourseListMetaData('1242-000441', sessionListHash, currentTime)
    );
    sessionListHash = TestConfig.hash(
      '1242',
      '004289',
      JSON.stringify(session004289)
    );
    sessionListMetaDataSample.push(
      new CourseListMetaData('1242-004289', sessionListHash, currentTime)
    );
    sessionListHash = TestConfig.hash(
      '1244',
      '000803',
      JSON.stringify(session000803)
    );
    sessionListMetaDataSample.push(
      new CourseListMetaData('1244-000803', sessionListHash, currentTime)
    );
    sessionListHash = TestConfig.hash(
      '1244',
      '024684.13',
      JSON.stringify(session024684)
    );
    sessionListMetaDataSample.push(
      new CourseListMetaData('1244-024684.13', sessionListHash, currentTime)
    );
    // Create a new sessionListMetaData entries on test DB
    for (let index = 0; index < sessionListMetaDataSample.length; ++index) {
      await this.dbClient
        .container('sessionListMetaData')
        .items.create(sessionListMetaDataSample[index]);
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
