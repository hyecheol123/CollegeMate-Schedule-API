/**
 * Jest unit test for GET /schedule/{scheduleId} method
 *
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

// eslint-disable-next-line node/no-unpublished-import
import * as request from 'supertest';
import * as jwt from 'jsonwebtoken';
import TestEnv from '../../TestEnv';
import ExpressServer from '../../../src/ExpressServer';
import AuthToken from '../../../src/datatypes/Token/AuthToken';
import TestConfig from '../../TestConfig';

describe('GET /schedule/:scheduleId - get Schedule Detail', () => {
  let testEnv: TestEnv;

  const accessTokenMap = {
    park: '',
    steve: '',
    drag: '',
    refresh: '',
    expired: '',
    admin: '',
    jerry: '',
  };

  const scheduleIdMap = {
    steve: '',
    drag: '',
    invalid: 'invalid',
    park: '',
  };

  beforeEach(async () => {
    // Setup test environment
    testEnv = new TestEnv(expect.getState().currentTestName as string);

    // Start Test Environment
    await testEnv.start();

    // Create Access Token
    // Valid Park Access Token
    let tokenContent: AuthToken = {
      id: 'park@wisc.edu',
      type: 'access',
      tokenType: 'user',
    };
    // Generate AccessToken
    accessTokenMap.park = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      {algorithm: 'HS512', expiresIn: '10m'}
    );

    // Valid Steve Access Token
    tokenContent = {
      id: 'steve@wisc.edu',
      type: 'access',
      tokenType: 'user',
    };
    // Generate AccessToken
    accessTokenMap.steve = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      {algorithm: 'HS512', expiresIn: '10m'}
    );

    // Valid Drag Access Token
    tokenContent = {
      id: 'drag@wisc.edu',
      type: 'access',
      tokenType: 'user',
    };
    // Generate AccessToken
    accessTokenMap.drag = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      {algorithm: 'HS512', expiresIn: '10m'}
    );

    // Valid Jerry Access Token
    tokenContent = {
      id: 'jerry@wisc.edu',
      type: 'access',
      tokenType: 'user',
    };
    // Generate AccessToken
    accessTokenMap.jerry = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      {algorithm: 'HS512', expiresIn: '10m'}
    );

    // Refresh Token
    // Token Content
    tokenContent = {
      id: 'refresh@wisc.edu',
      type: 'refresh',
      tokenType: 'user',
    };
    // Generate AccessToken
    accessTokenMap.refresh = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      {algorithm: 'HS512', expiresIn: '10m'}
    );

    // Expired Access Token
    // Token Content
    tokenContent = {
      id: 'expired@wisc.edu',
      type: 'access',
      tokenType: 'user',
    };
    // Generate AccessToken
    accessTokenMap.expired = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      {algorithm: 'HS512', expiresIn: '1ms'}
    );

    // Admin token
    // Token Content
    tokenContent = {
      id: 'testAdmin',
      type: 'access',
      tokenType: 'serverAdmin',
      accountType: 'admin',
    };
    // Generate AccessToken
    accessTokenMap.admin = jwt.sign(
      tokenContent,
      testEnv.testConfig.jwt.secretKey,
      {algorithm: 'HS512', expiresIn: '1ms'}
    );

    // Steve's ScheduleId
    let email = 'steve@wisc.edu';
    let termCode = '1242';
    const testDate = '2021-04-01T00:00:00.000Z';
    scheduleIdMap.steve = TestConfig.hash(
      `${email}/${termCode}/${testDate}`,
      email,
      termCode
    );

    // Drag's ScheduleId
    email = 'drag@wisc.edu';
    termCode = '1244';
    scheduleIdMap.drag = TestConfig.hash(
      `${email}/${termCode}/${testDate}`,
      email,
      termCode
    );

    // Invalid ScheduleId
    scheduleIdMap.invalid = 'invalid';
  });

  afterEach(async () => {
    await testEnv.stop();
  });

  test('Fail - No Access Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    // reqeust without a token
    const response = await request(testEnv.expressServer.app)
      .get(`/schedule/${scheduleIdMap.steve}`)
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthenticated');
  });

  test('Fail - Expired Access Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Wait for 5 ms to expire the access token
    await new Promise(resolve => setTimeout(resolve, 5));

    // request with an expired access token from web
    const response = await request(testEnv.expressServer.app)
      .get(`/schedule/${scheduleIdMap.steve}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.expired})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Wrong Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // reqeust with admin token
    let response = await request(testEnv.expressServer.app)
      .get(`/schedule/${scheduleIdMap.steve}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.admin})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // request with refresh token
    response = await request(testEnv.expressServer.app)
      .get(`/schedule/${scheduleIdMap.steve}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.refresh})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // request with "wrong" token
    response = await request(testEnv.expressServer.app)
      .get(`/schedule/${scheduleIdMap.steve}`)
      .set({'X-ACCESS-TOKEN': 'wrong'})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Not from Origin nor App', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // request without any origin or app
    let response = await request(testEnv.expressServer.app)
      .get(`/schedule/${scheduleIdMap.steve}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // request without from wrong origin and not app
    response = await request(testEnv.expressServer.app)
      .get(`/schedule/${scheduleIdMap.steve}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://wrong.origin.com'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // request without from wrong app
    response = await request(testEnv.expressServer.app)
      .get(`/schedule/${scheduleIdMap.steve}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({'X-APPLICATION-KEY': 'wrongAppKey'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Schedule does not exist', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // request with a valid user but no schedule
    let response = await request(testEnv.expressServer.app)
      .get(`/schedule/${scheduleIdMap.park}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.park})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not Found');

    response = await request(testEnv.expressServer.app)
      .get(`/schedule/${scheduleIdMap.park}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.drag})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not Found');
  });

  test('Fail - Invalid Schedule Id', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // request with a invalid schedule id
    const response = await request(testEnv.expressServer.app)
      .get('/schedule/invalid')
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not Found');
  });

  test('Fail - Not Friend of Schedule Owner', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // request with a valid user but not friend
    let response = await request(testEnv.expressServer.app)
      .get(`/schedule/${scheduleIdMap.steve}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.park})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    response = await request(testEnv.expressServer.app)
      .get(`/schedule/${scheduleIdMap.drag}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.park})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Success from web', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    // request himself or between friends
    // drag request drag's schedule
    let response = await request(testEnv.expressServer.app)
      .get(`/schedule/${scheduleIdMap.drag}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.drag})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(200);
    expect(response.body.email).toBe('drag@wisc.edu');
    expect(response.body.termCode).toBe('1244');
    expect(response.body.sessionList.length).toEqual(2);
    expect(response.body.sessionList[0].id).toBe('1244-000003');
    expect(response.body.sessionList[1].id).toBe('1244-000004');
    expect(response.body.eventList.length).toEqual(2);
    expect(response.body.eventList[0].title).toBe('Birthday');
    expect(response.body.eventList[1].title).toBe('Meeting');

    // steve request drag's schedule
    response = await request(testEnv.expressServer.app)
      .get(`/schedule/${scheduleIdMap.drag}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(200);
    expect(response.body.email).toBe('drag@wisc.edu');
    expect(response.body.termCode).toBe('1244');
    expect(response.body.sessionList.length).toEqual(2);
    expect(response.body.sessionList[0].colorCode).toBe(0);
    expect(response.body.sessionList[1].colorCode).toBe(1);
    expect(response.body.eventList.length).toEqual(2);
    expect(response.body.eventList[0].id).toBe('1244-000001');
    expect(response.body.eventList[1].id).toBe('1244-000002');

    // drag request steve's schedule
    response = await request(testEnv.expressServer.app)
      .get(`/schedule/${scheduleIdMap.steve}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.drag})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(200);
    expect(response.body.email).toBe('steve@wisc.edu');
    expect(response.body.termCode).toBe('1242');
    expect(response.body.sessionList.length).toEqual(2);
    expect(response.body.sessionList[0].colorCode).toBe(0);
    expect(response.body.sessionList[1].colorCode).toBe(1);
    expect(response.body.eventList.length).toEqual(2);
    expect(response.body.eventList[0].id).toBe('1242-000001');
    expect(response.body.eventList[1].id).toBe('1242-000002');

    // steve request steve's schedule
    response = await request(testEnv.expressServer.app)
      .get(`/schedule/${scheduleIdMap.steve}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(200);
    expect(response.body.email).toBe('steve@wisc.edu');
    expect(response.body.termCode).toBe('1242');
    expect(response.body.sessionList.length).toEqual(2);
    expect(response.body.sessionList[0].id).toBe('1242-000003');
    expect(response.body.sessionList[1].id).toBe('1242-000004');
    expect(response.body.eventList.length).toEqual(2);
    expect(response.body.eventList[0].title).toBe('Birthday');
    expect(response.body.eventList[1].title).toBe('Meeting');

    // jerry request steve's schedule
    response = await request(testEnv.expressServer.app)
      .get(`/schedule/${scheduleIdMap.steve}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.jerry})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(200);
    expect(response.body.email).toBe('steve@wisc.edu');
    expect(response.body.termCode).toBe('1242');
    expect(response.body.sessionList.length).toEqual(2);
    expect(response.body.sessionList[0].id).toBe('1242-000003');
    expect(response.body.sessionList[1].id).toBe('1242-000004');
    expect(response.body.eventList.length).toEqual(2);
    expect(response.body.eventList[0].title).toBe('Birthday');
    expect(response.body.eventList[1].title).toBe('Meeting');
    expect(response.body.eventList[0].id).toBe('1242-000001');
    expect(response.body.eventList[1].id).toBe('1242-000002');
    expect(response.body.sessionList[0].colorCode).toBe(0);
    expect(response.body.sessionList[1].colorCode).toBe(1);
  });

  test('Success from app', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    // request himself or between friends
    // drag request drag's schedule
    let response = await request(testEnv.expressServer.app)
      .get(`/schedule/${scheduleIdMap.drag}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.drag})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'});
    expect(response.status).toBe(200);
    expect(response.body.email).toBe('drag@wisc.edu');
    expect(response.body.termCode).toBe('1244');
    expect(response.body.sessionList.length).toEqual(2);
    expect(response.body.sessionList[0].id).toBe('1244-000003');
    expect(response.body.sessionList[1].id).toBe('1244-000004');
    expect(response.body.eventList.length).toEqual(2);
    expect(response.body.eventList[0].title).toBe('Birthday');
    expect(response.body.eventList[1].title).toBe('Meeting');

    // steve request drag's schedule
    response = await request(testEnv.expressServer.app)
      .get(`/schedule/${scheduleIdMap.drag}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'});
    expect(response.status).toBe(200);
    expect(response.body.email).toBe('drag@wisc.edu');
    expect(response.body.termCode).toBe('1244');
    expect(response.body.sessionList.length).toEqual(2);
    expect(response.body.sessionList[0].colorCode).toBe(0);
    expect(response.body.sessionList[1].colorCode).toBe(1);
    expect(response.body.eventList.length).toEqual(2);
    expect(response.body.eventList[0].id).toBe('1244-000001');
    expect(response.body.eventList[1].id).toBe('1244-000002');

    // drag request steve's schedule
    response = await request(testEnv.expressServer.app)
      .get(`/schedule/${scheduleIdMap.steve}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.drag})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'});
    expect(response.status).toBe(200);
    expect(response.body.email).toBe('steve@wisc.edu');
    expect(response.body.termCode).toBe('1242');
    expect(response.body.sessionList.length).toEqual(2);
    expect(response.body.sessionList[0].colorCode).toBe(0);
    expect(response.body.sessionList[1].colorCode).toBe(1);
    expect(response.body.eventList.length).toEqual(2);
    expect(response.body.eventList[0].id).toBe('1242-000001');
    expect(response.body.eventList[1].id).toBe('1242-000002');

    // steve request steve's schedule
    response = await request(testEnv.expressServer.app)
      .get(`/schedule/${scheduleIdMap.steve}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'});
    expect(response.status).toBe(200);
    expect(response.body.email).toBe('steve@wisc.edu');
    expect(response.body.termCode).toBe('1242');
    expect(response.body.sessionList.length).toEqual(2);
    expect(response.body.sessionList[0].id).toBe('1242-000003');
    expect(response.body.sessionList[1].id).toBe('1242-000004');
    expect(response.body.eventList.length).toEqual(2);
    expect(response.body.eventList[0].title).toBe('Birthday');
    expect(response.body.eventList[1].title).toBe('Meeting');

    // jerry request drag's schedule
    response = await request(testEnv.expressServer.app)
      .get(`/schedule/${scheduleIdMap.drag}`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.jerry})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'});
    expect(response.status).toBe(200);
    expect(response.body.email).toBe('drag@wisc.edu');
    expect(response.body.termCode).toBe('1244');
    expect(response.body.sessionList.length).toEqual(2);
    expect(response.body.sessionList[0].id).toBe('1244-000003');
    expect(response.body.sessionList[1].id).toBe('1244-000004');
    expect(response.body.eventList.length).toEqual(2);
    expect(response.body.eventList[0].title).toBe('Birthday');
    expect(response.body.eventList[1].title).toBe('Meeting');
    expect(response.body.eventList[0].id).toBe('1244-000001');
    expect(response.body.eventList[1].id).toBe('1244-000002');
    expect(response.body.sessionList[0].colorCode).toBe(0);
    expect(response.body.sessionList[1].colorCode).toBe(1);
  });
});
