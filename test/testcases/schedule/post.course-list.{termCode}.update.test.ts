/**
 * Jest Unit Test for POST /schedule/course-list/:termCode/update method
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

// eslint-disable-next-line node/no-unpublished-import
import * as request from 'supertest';
import * as Cosmos from '@azure/cosmos';
import TestEnv from '../../TestEnv';
import ExpressServer from '../../../src/ExpressServer';
import AuthToken from '../../../src/datatypes/Token/AuthToken';
import * as jwt from 'jsonwebtoken';
import TestConfig from '../../TestConfig';
import CourseListMetaData from '../../../src/datatypes/courseListMetaData/CourseListMetaData';
import Course from '../../../src/datatypes/course/Course';

describe('POST /schedule/course-list/:termCode/update - Update Course List (API Use / Admin Use)', () => {
  let testEnv: TestEnv;
  const tokenMap = {
    admin: '',
    user: '',
    refresh: '',
    invalid: '',
  };
  const COURSE = 'course';
  const COURSE_LIST_META_DATA = 'courseListMetaData';
  const SESSION = 'session';
  const SESSION_LIST_META_DATA = 'sessionListMetaData';

  beforeEach(async () => {
    // Setup test environment
    testEnv = new TestEnv(expect.getState().currentTestName as string);

    // Start Test Environment
    await testEnv.start();

    // Create a test tokens
    const tokenContent: AuthToken = {
      id: 'test',
      type: 'access',
      tokenType: 'serverAdmin',
      accountType: 'admin',
    };
    tokenMap.admin = jwt.sign(tokenContent, testEnv.testConfig.jwt.secretKey, {
      algorithm: 'HS512',
      expiresIn: '60m',
    });

    tokenContent.tokenType = 'user';
    tokenMap.user = jwt.sign(tokenContent, testEnv.testConfig.jwt.secretKey, {
      algorithm: 'HS512',
      expiresIn: '60m',
    });
    tokenContent.tokenType = 'serverAdmin';

    tokenContent.type = 'refresh';
    tokenMap.refresh = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      {
        algorithm: 'HS512',
        expiresIn: '60m',
      }
    );

    const invalidToken = {
      id: 'test',
      type: 'access',
      tokenType: 'serverAdmin',
      accountType: 'random',
    };
    tokenMap.invalid = jwt.sign(
      invalidToken,
      testEnv.testConfig.jwt.secretKey,
      {
        algorithm: 'HS512',
        expiresIn: '60m',
      }
    );
  });

  afterEach(async () => {
    await testEnv.stop();
  });

  test('Fail - No ServerToken', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Request with no serverToken
    const response = await request(testEnv.expressServer.app)
      .post('/schedule/course-list/1234/update')
      .send({forceUpdate: true});
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthenticated');
  });

  test('Fail - Invalid ServerToken', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Request with refresh token instead of serverAdminToken
    let response = await request(testEnv.expressServer.app)
      .post('/schedule/course-list/1234/update')
      .set({
        'X-SERVER-TOKEN': tokenMap.refresh,
      })
      .send({forceUpdate: true});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Request with wrong serverToken
    response = await request(testEnv.expressServer.app)
      .post('/schedule/course-list/1234/update')
      .set({
        'X-SERVER-TOKEN': 'test',
      })
      .send({forceUpdate: true});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Request with invalid serverToken
    response = await request(testEnv.expressServer.app)
      .post('/schedule/course-list/1234/update')
      .set({
        'X-SERVER-TOKEN': tokenMap.invalid,
      })
      .send({forceUpdate: true});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Request with wrong body', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Request with no body
    let response = await request(testEnv.expressServer.app)
      .post('/schedule/course-list/1234/update')
      .set({
        'X-SERVER-TOKEN': tokenMap.admin,
      });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');

    // Request with additional body
    response = await request(testEnv.expressServer.app)
      .post('/schedule/course-list/1234/update')
      .set({
        'X-SERVER-TOKEN': tokenMap.admin,
      })
      .send({forceUpdate: true, test: 'test'});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');

    // Request with only additional body
    response = await request(testEnv.expressServer.app)
      .post('/schedule/course-list/1234/update')
      .set({
        'X-SERVER-TOKEN': tokenMap.admin,
      })
      .send({test: 'test'});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');
  });

  test('Fail - No ForceUpdate and Has not passed 12 hours', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Request with no forceUpdate
    const response = await request(testEnv.expressServer.app)
      .post('/schedule/course-list/1244/update')
      .set({
        'X-SERVER-TOKEN': tokenMap.admin,
      })
      .send({forceUpdate: false});
    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Conflict');
  });

  test('Success - No ForceUpdate and Has passed 12 hours with change', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Create courseListMetaData in the database that has passed 12 hours
    const lastChecked = new Date(
      Date.now() - 1000 * 60 * 60 * 13
    ).toISOString();
    const courseListMetaData = new CourseListMetaData(
      '1234',
      TestConfig.hash('1234', '1234', JSON.stringify('test')),
      lastChecked
    );
    await testEnv.dbClient
      .container('courseListMetaData')
      .items.create(courseListMetaData);

    // Request with no forceUpdate
    const response = await request(testEnv.expressServer.app)
      .post('/schedule/course-list/1234/update')
      .set({
        'X-SERVER-TOKEN': tokenMap.admin,
      })
      .send({forceUpdate: false});
    expect(response.status).toBe(202);

    // Wait 500ms for mocking
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if the courseList is updated
    const dbOps = await testEnv.dbClient
      .container(COURSE_LIST_META_DATA)
      .item('1234')
      .read();
    expect(dbOps.resource.lastChecked).not.toEqual(lastChecked);
    expect(dbOps.resource.hash).not.toEqual(courseListMetaData.hash);
  });

  test('Success - ForceUpdate - 2 New Courses, 2 Deleted Courses', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    const prevCourseListMetaData = (
      await testEnv.dbClient
        .container(COURSE_LIST_META_DATA)
        .item('1244')
        .read()
    ).resource;

    // Request with forceUpdate
    const response = await request(testEnv.expressServer.app)
      .post('/schedule/course-list/1244/update')
      .set({
        'X-SERVER-TOKEN': tokenMap.admin,
      })
      .send({forceUpdate: true});
    expect(response.status).toBe(202);

    // Wait 500ms for mocking
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if the courseList is updated
    const dbOps = await testEnv.dbClient
      .container(COURSE_LIST_META_DATA)
      .item('1244')
      .read();
    expect(dbOps.resource.lastChecked).not.toEqual(
      prevCourseListMetaData.lastChecked
    );
    expect(dbOps.resource.hash).not.toEqual(prevCourseListMetaData.hash);
    // Check if the course, session, and sessionListMetaData are updated
    let dbOps2 = await testEnv.dbClient
      .container('course')
      .items.query({
        query: `SELECT * FROM ${COURSE} AS c WHERE c.termCode = @termCode`,
        parameters: [
          {
            name: '@termCode',
            value: '1244',
          },
        ],
      })
      .fetchAll();
    expect(dbOps2.resources.length).toEqual(1);
    expect(dbOps2.resources[0].id).toEqual('1244-001065');
    dbOps2 = await testEnv.dbClient
      .container('session')
      .items.query({
        query: `SELECT * FROM ${SESSION} c WHERE c.termCode = @termCode`,
        parameters: [
          {
            name: '@termCode',
            value: '1244',
          },
        ],
      })
      .fetchAll();
    expect(dbOps2.resources.length).toEqual(6);
    expect(dbOps2.resources[0].courseId).toEqual('001065');
  });

  test('Success - ForceUpdate - 1 Updated Courses, 1 Unchanged Courses', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    const prevCourseListMetaData = (
      await testEnv.dbClient
        .container(COURSE_LIST_META_DATA)
        .item('1242')
        .read()
    ).resource;
    const prevSessionListMetaData = (
      await testEnv.dbClient
        .container(SESSION_LIST_META_DATA)
        .item('1242-000441')
        .read()
    ).resource;
    const prevSessionListMetaData2 = (
      await testEnv.dbClient
        .container(SESSION_LIST_META_DATA)
        .item('1242-004289')
        .read()
    ).resource;

    // Request with forceUpdate
    const response = await request(testEnv.expressServer.app)
      .post('/schedule/course-list/1242/update')
      .set({
        'X-SERVER-TOKEN': tokenMap.admin,
      })
      .send({forceUpdate: true});
    expect(response.status).toBe(202);

    // Wait 1000ms for database to update
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if the courseList is updated
    let dbOps = await testEnv.dbClient
      .container(COURSE_LIST_META_DATA)
      .item('1242')
      .read();
    expect(dbOps.resource.lastChecked).not.toEqual(
      prevCourseListMetaData.lastChecked
    );
    expect(dbOps.resource.hash).toEqual(prevCourseListMetaData.hash);
    // Check if the course, session, and sessionListMetaData are updated
    let dbOps2 = await testEnv.dbClient
      .container(COURSE)
      .items.query({
        query: `SELECT * FROM ${COURSE} AS c WHERE c.termCode = @termCode`,
        parameters: [
          {
            name: '@termCode',
            value: '1242',
          },
        ],
      })
      .fetchAll();
    expect(dbOps2.resources.length).toEqual(2);
    dbOps2 = await testEnv.dbClient
      .container(SESSION)
      .items.query({
        query: `SELECT * FROM ${SESSION} c WHERE c.termCode = @termCode`,
        parameters: [
          {
            name: '@termCode',
            value: '1242',
          },
        ],
      })
      .fetchAll();
    expect(dbOps2.resources.length).toEqual(16);
    dbOps = await testEnv.dbClient
      .container(SESSION_LIST_META_DATA)
      .item('1242-000441')
      .read();
    expect(dbOps.resource.hash).toEqual(prevSessionListMetaData.hash);
    dbOps = await testEnv.dbClient
      .container(SESSION_LIST_META_DATA)
      .item('1242-004289')
      .read();
    expect(dbOps.resource.hash).not.toEqual(prevSessionListMetaData2.hash);
  });

  test('Success - No Previous CourseListMetaData', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Request
    const response = await request(testEnv.expressServer.app)
      .post('/schedule/course-list/1234/update')
      .set({
        'X-SERVER-TOKEN': tokenMap.admin,
      })
      .send({forceUpdate: false});
    expect(response.status).toBe(202);

    // Wait 500ms for mocking
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if the courseList is updated
    let dbOps = await testEnv.dbClient
      .container(COURSE_LIST_META_DATA)
      .item('1234')
      .read();
    expect(dbOps.resource.lastChecked).not.toEqual(undefined);
    expect(dbOps.resource.hash).not.toEqual(undefined);

    // Check if the course, session, and sessionListMetaData are updated 001065
    let dbOps2 = await testEnv.dbClient
      .container(COURSE)
      .items.query({
        query: `SELECT * FROM ${COURSE} AS c WHERE c.termCode = @termCode`,
        parameters: [
          {
            name: '@termCode',
            value: '1234',
          },
        ],
      })
      .fetchAll();
    expect(dbOps2.resources.length).toEqual(1);
    expect(dbOps2.resources[0].id).toEqual('1234-001065');

    dbOps2 = await testEnv.dbClient
      .container(SESSION)
      .items.query({
        query: `SELECT * FROM ${SESSION} c WHERE c.termCode = @termCode`,
        parameters: [
          {
            name: '@termCode',
            value: '1234',
          },
        ],
      })
      .fetchAll();
    expect(dbOps2.resources.length).toEqual(6);
    expect(dbOps2.resources[0].courseId).toEqual('001065');

    dbOps = await testEnv.dbClient
      .container(SESSION_LIST_META_DATA)
      .item('1234-001065')
      .read();
    expect(dbOps.resource.hash).not.toEqual(undefined);
  });

  test('Success - No change', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Create courseListMetaData in the database that has passed 12 hours
    const lastChecked = new Date(
      Date.now() - 1000 * 60 * 60 * 13
    ).toISOString();
    const courseList: Course[] = [
      {
        id: '1234-001065',
        courseName: 'ART 102',
        courseId: '001065',
        subjectCode: '168',
        description:
          'Provides an introduction to the fundamentals of two-dimensional design. Develop a clear understanding of visual communication through problem-solving and formal and conceptual experimentation. Learn the elements and principles of design and manipulate those using analog and digital processes. Introduction to the Adobe Creative Suite of products, including InDesign, Illustrator, and (to a lesser degree) Photoshop. Serves as an introduction to professional presentation skills and techniques to hone craftsmanship. ',
        fullCourseName: 'ART DEPARTMENT 102',
        termCode: '1234',
        title: 'Two-Dimensional Design',
      },
    ];
    const courseListMetaData = new CourseListMetaData(
      '1234',
      TestConfig.hash('1234', '1234', JSON.stringify(courseList)),
      lastChecked
    );
    await testEnv.dbClient
      .container(COURSE_LIST_META_DATA)
      .items.create(courseListMetaData);

    // Request with no forceUpdate
    const response = await request(testEnv.expressServer.app)
      .post('/schedule/course-list/1234/update')
      .set({
        'X-SERVER-TOKEN': tokenMap.admin,
      })
      .send({forceUpdate: false});
    expect(response.status).toBe(202);

    // Wait 500ms for mocking
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if the courseList is updated
    const dbOps = await testEnv.dbClient
      .container(COURSE_LIST_META_DATA)
      .item('1234')
      .read();
    expect(dbOps.resource.lastChecked).not.toEqual(lastChecked);
    expect(dbOps.resource.hash).toEqual(courseListMetaData.hash);
  });
});
