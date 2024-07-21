/**
 * Jest Unit Test for PATCH /schedule/:scheduleId/event/:eventId
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
import Schedule from '../../../src/datatypes/schedule/Schedule';

describe('PATCH /schedule/:scheduleId/event/:eventId - Edit Event/Session', () => {
  let testEnv: TestEnv;
  const SCHEDULE = 'schedule';
  const accessTokenMap = {
    steve: '',
    drag: '',
    leap: '',
    refresh: '',
    expired: '',
    admin: '',
  };
  const scheduleIdMap = {
    steve: '',
    drag: '',
    leap: '',
    invalid: 'invalid',
  };
  const nonConflictingEventEdit = {
    eventType: 'event',
    startTime: {
      month: 4,
      day: 1,
      hour: 0,
      minute: 0,
    },
    endTime: {
      month: 4,
      day: 1,
      hour: 0,
      minute: 1,
    },
  };

  beforeEach(async () => {
    // Setup test environment
    testEnv = new TestEnv(expect.getState().currentTestName as string);

    // Start Test Environment
    await testEnv.start();

    // Create Access Token
    // Valid Steve Access Token
    let tokenContent: AuthToken = {
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
    // Valid Leap Access Token
    tokenContent = {
      id: 'leap@wisc.edu',
      type: 'access',
      tokenType: 'user',
    };
    // Generate AccessToken
    accessTokenMap.leap = jwt.sign(
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

    // Leap's ScheduleId
    email = 'leap@wisc.edu';
    termCode = '1234';
    scheduleIdMap.leap = TestConfig.hash(
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
      .patch(`/schedule/${scheduleIdMap.steve}/event/1242-000001`)
      .set({Origin: 'https://collegemate.app'})
      .send(nonConflictingEventEdit);
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthenticated');
  });

  test('Fail - Expired Access Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Wait for 5 ms to expire the access token
    await new Promise(resolve => setTimeout(resolve, 5));

    // request with an expired access token from web
    const response = await request(testEnv.expressServer.app)
      .patch(`/schedule/${scheduleIdMap.steve}/event/1242-000001`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.expired})
      .set({Origin: 'https://collegemate.app'})
      .send(nonConflictingEventEdit);
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Wrong Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // reqeust with admin token
    let response = await request(testEnv.expressServer.app)
      .patch(`/schedule/${scheduleIdMap.steve}/event/1242-000001`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.admin})
      .set({Origin: 'https://collegemate.app'})
      .send(nonConflictingEventEdit);
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // request with refresh token
    response = await request(testEnv.expressServer.app)
      .delete(`/schedule/${scheduleIdMap.steve}/event/1242-000001`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.refresh})
      .set({Origin: 'https://collegemate.app'})
      .send(nonConflictingEventEdit);
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // request with "wrong" token
    response = await request(testEnv.expressServer.app)
      .delete(`/schedule/${scheduleIdMap.steve}/event/1242-000001`)
      .set({'X-ACCESS-TOKEN': 'wrong'})
      .set({Origin: 'https://collegemate.app'})
      .send(nonConflictingEventEdit);
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Not from Origin nor App', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // request without any origin or app
    let response = await request(testEnv.expressServer.app)
      .patch(`/schedule/${scheduleIdMap.steve}/event/1242-000001`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .send(nonConflictingEventEdit);
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // request without from wrong origin and not app
    response = await request(testEnv.expressServer.app)
      .patch(`/schedule/${scheduleIdMap.steve}/event/1242-000001`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://wrong.origin.com'})
      .send(nonConflictingEventEdit);
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // request without from wrong app
    response = await request(testEnv.expressServer.app)
      .patch(`/schedule/${scheduleIdMap.steve}/event/1242-000001`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({'X-APPLICATION-KEY': 'wrongAppKey'})
      .send(nonConflictingEventEdit);
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Schedule does not exist', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // request with a invalid scheduleId
    let response = await request(testEnv.expressServer.app)
      .patch(`/schedule/${scheduleIdMap.invalid}/event/1242-000001`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send(nonConflictingEventEdit);
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not Found');

    // request with another invalid scheduleId
    response = await request(testEnv.expressServer.app)
      .patch('/schedule/1111/event/1242-000001')
      .set({'X-ACCESS-TOKEN': accessTokenMap.drag})
      .set({Origin: 'https://collegemate.app'})
      .send(nonConflictingEventEdit);
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not Found');
  });

  test('Fail - User is not the owner of the Schedule', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Steve tries to edit Drag's schedule
    let response = await request(testEnv.expressServer.app)
      .patch(`/schedule/${scheduleIdMap.drag}/event/1244-000001`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send(nonConflictingEventEdit);
    expect(response.status).toBe(403);

    // Drag tries to write to Steve's schedule
    response = await request(testEnv.expressServer.app)
      .patch(`/schedule/${scheduleIdMap.steve}/event/1242-000001`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.drag})
      .set({Origin: 'https://collegemate.app'})
      .send(nonConflictingEventEdit);
    expect(response.status).toBe(403);
  });

  test('Fail - Invalid Event Type', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    const eventEdit = {
      eventType: 'invalid',
      startTime: {
        month: 4,
        day: 1,
        hour: 0,
        minute: 0,
      },
      endTime: {
        month: 4,
        day: 1,
        hour: 0,
        minute: 0,
      },
    };

    // Event Edit
    const response = await request(testEnv.expressServer.app)
      .patch(`/schedule/${scheduleIdMap.steve}/event/1242-000001`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send(eventEdit);
    expect(response.status).toBe(400);
  });

  test('Fail - Invalid Event/Session Id', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    const response = await request(testEnv.expressServer.app)
      .patch(`/schedule/${scheduleIdMap.steve}/event/1242-000010`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send(nonConflictingEventEdit);
    expect(response.status).toBe(404);
  });

  test('Fail - Invalid Date', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    let eventEdit = {
      eventType: 'event',
      meetingDaysList: ['MONDAY'],
      startTime: {
        month: 4,
        day: 31,
        hour: 13,
        minute: 30,
      },
      endTime: {
        month: 5,
        day: 1,
        hour: 14,
        minute: 45,
      },
    };

    let response = await request(testEnv.expressServer.app)
      .patch(`/schedule/${scheduleIdMap.steve}/event/1242-000001`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send(eventEdit);
    expect(response.status).toBe(400);

    eventEdit = {
      eventType: 'event',
      meetingDaysList: ['MONDAY'],
      startTime: {
        month: 2,
        day: 30,
        hour: 13,
        minute: 30,
      },
      endTime: {
        month: 4,
        day: 1,
        hour: 14,
        minute: 45,
      },
    };

    response = await request(testEnv.expressServer.app)
      .patch(`/schedule/${scheduleIdMap.steve}/event/1242-000001`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send(eventEdit);
    expect(response.status).toBe(400);

    eventEdit = {
      eventType: 'event',
      meetingDaysList: ['MONDAY'],
      startTime: {
        month: 2,
        day: 20,
        hour: 25,
        minute: 30,
      },
      endTime: {
        month: 4,
        day: 1,
        hour: 14,
        minute: 45,
      },
    };

    response = await request(testEnv.expressServer.app)
      .patch(`/schedule/${scheduleIdMap.steve}/event/1242-000001`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send(eventEdit);
    expect(response.status).toBe(400);

    eventEdit = {
      eventType: 'event',
      meetingDaysList: ['MONDAY'],
      startTime: {
        month: 2,
        day: 12,
        hour: 11,
        minute: 60,
      },
      endTime: {
        month: 4,
        day: 1,
        hour: 14,
        minute: 45,
      },
    };

    // Event Edit
    response = await request(testEnv.expressServer.app)
      .patch(`/schedule/${scheduleIdMap.steve}/event/1242-000001`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send(eventEdit);
    expect(response.status).toBe(400);

    // Event Edit
    response = await request(testEnv.expressServer.app)
      .patch(`/schedule/${scheduleIdMap.steve}/event/1242-000001`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send(eventEdit);
    expect(response.status).toBe(400);

    eventEdit = {
      eventType: 'event',
      meetingDaysList: ['MONDAY'],
      startTime: {
        month: 2,
        day: 29,
        hour: 11,
        minute: 30,
      },
      endTime: {
        month: 4,
        day: 1,
        hour: 14,
        minute: 45,
      },
    };

    // Event Edit
    response = await request(testEnv.expressServer.app)
      .patch(`/schedule/${scheduleIdMap.leap}/event/1234-000001`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.leap})
      .set({Origin: 'https://collegemate.app'})
      .send(eventEdit);
    expect(response.status).toBe(400);
  });

  test('Fail - Start time after End time', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    let eventEdit = {
      eventType: 'event',
      meetingDaysList: ['MONDAY'],
      startTime: {
        month: 4,
        day: 1,
        hour: 15,
        minute: 30,
      },
      endTime: {
        month: 4,
        day: 1,
        hour: 14,
        minute: 45,
      },
    };

    // Event Edit
    let response = await request(testEnv.expressServer.app)
      .patch(`/schedule/${scheduleIdMap.steve}/event/1242-000001`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send(eventEdit);
    expect(response.status).toBe(400);

    eventEdit = {
      eventType: 'event',
      meetingDaysList: ['MONDAY'],
      startTime: {
        month: 4,
        day: 2,
        hour: 13,
        minute: 30,
      },
      endTime: {
        month: 4,
        day: 1,
        hour: 14,
        minute: 45,
      },
    };

    // Event Edit
    response = await request(testEnv.expressServer.app)
      .patch(`/schedule/${scheduleIdMap.steve}/event/1242-000001`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send(eventEdit);
    expect(response.status).toBe(400);
  });

  test('Fail - Preexisting SessionId', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    const eventEdit = {
      eventType: 'session',
      sessionId: '1242-000004',
    };

    // Event Edit
    const response = await request(testEnv.expressServer.app)
      .patch(`/schedule/${scheduleIdMap.steve}/event/1242-000001`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send(eventEdit);
    expect(response.status).toBe(409);
  });

  test('Fail - Start time after preexisting End time', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    let eventEdit = {
      eventType: 'event',
      meetingDaysList: ['MONDAY'],
      startTime: {
        month: 4,
        day: 1,
        hour: 10,
        minute: 46,
      },
    };

    // Event Edit
    let response = await request(testEnv.expressServer.app)
      .patch(`/schedule/${scheduleIdMap.steve}/event/1242-000001`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send(eventEdit);
    expect(response.status).toBe(409);

    eventEdit = {
      eventType: 'event',
      meetingDaysList: ['MONDAY'],
      startTime: {
        month: 4,
        day: 2,
        hour: 14,
        minute: 30,
      },
    };

    // Event Edit
    response = await request(testEnv.expressServer.app)
      .patch(`/schedule/${scheduleIdMap.steve}/event/1242-000002`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send(eventEdit);
    expect(response.status).toBe(409);
  });

  test('Fail - End time before preexisting Start time', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    let eventEdit = {
      eventType: 'event',
      meetingDaysList: ['MONDAY'],
      endTime: {
        month: 4,
        day: 1,
        hour: 9,
        minute: 29,
      },
    };

    // Event Edit
    let response = await request(testEnv.expressServer.app)
      .patch(`/schedule/${scheduleIdMap.steve}/event/1242-000001`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send(eventEdit);
    expect(response.status).toBe(409);

    eventEdit = {
      eventType: 'event',
      meetingDaysList: ['MONDAY'],
      endTime: {
        month: 1,
        day: 1,
        hour: 13,
        minute: 10,
      },
    };

    // Event Edit
    response = await request(testEnv.expressServer.app)
      .patch(`/schedule/${scheduleIdMap.steve}/event/1242-000002`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send(eventEdit);
    expect(response.status).toBe(409);
  });

  test('Fail - Nonexistent SessionId', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    const eventEdit = {
      eventType: 'session',
      sessionId: '1242-000010-00000',
    };

    // Event Edit
    const response = await request(testEnv.expressServer.app)
      .patch(`/schedule/${scheduleIdMap.steve}/event/1242-000001`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send(eventEdit);
    expect(response.status).toBe(404);
  });

  test('Fail - Overlapping Event/Session', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    let eventEdit = {
      eventType: 'event',
      meetingDaysList: ['TUESDAY'],
      startTime: {
        month: 4,
        day: 1,
        hour: 13,
        minute: 30,
      },
      endTime: {
        month: 4,
        day: 1,
        hour: 14,
        minute: 45,
      },
    };

    // Event Edit
    let response = await request(testEnv.expressServer.app)
      .patch(`/schedule/${scheduleIdMap.steve}/event/1242-000001`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send(eventEdit);
    expect(response.status).toBe(409);

    eventEdit = {
      eventType: 'event',
      meetingDaysList: ['TUESDAY'],
      startTime: {
        month: 4,
        day: 1,
        hour: 12,
        minute: 20,
      },
      endTime: {
        month: 4,
        day: 1,
        hour: 13,
        minute: 31,
      },
    };

    // Event Edit
    response = await request(testEnv.expressServer.app)
      .patch(`/schedule/${scheduleIdMap.steve}/event/1242-000001`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send(eventEdit);
    expect(response.status).toBe(409);

    eventEdit = {
      eventType: 'event',
      meetingDaysList: ['TUESDAY'],
      startTime: {
        month: 4,
        day: 1,
        hour: 14,
        minute: 44,
      },
      endTime: {
        month: 4,
        day: 1,
        hour: 15,
        minute: 30,
      },
    };

    // Event Edit
    response = await request(testEnv.expressServer.app)
      .patch(`/schedule/${scheduleIdMap.steve}/event/1242-000001`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send(eventEdit);
    expect(response.status).toBe(409);
  });

  test('Success - Edit Event', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    let eventEdit = {
      eventType: 'event',
      meetingDaysList: ['TUESDAY'],
      startTime: {
        month: 4,
        day: 1,
        hour: 12,
        minute: 30,
      },
      endTime: {
        month: 4,
        day: 1,
        hour: 13,
        minute: 29,
      },
    };

    // Event Edit
    let response = await request(testEnv.expressServer.app)
      .patch(`/schedule/${scheduleIdMap.steve}/event/1242-000001`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send(eventEdit);
    expect(response.status).toBe(200);

    let dbResponse = await testEnv.dbClient
      .container(SCHEDULE)
      .item(scheduleIdMap.steve)
      .read();
    let schedule: Schedule = dbResponse.resource;
    expect(
      schedule.eventList.filter(e => e.id === '1242-000001')[0].startTime
    ).toEqual({
      month: 4,
      day: 1,
      hour: 12,
      minute: 30,
    });

    eventEdit = {
      eventType: 'event',
      meetingDaysList: ['TUESDAY'],
      startTime: {
        month: 4,
        day: 1,
        hour: 14,
        minute: 46,
      },
      endTime: {
        month: 4,
        day: 1,
        hour: 15,
        minute: 20,
      },
    };

    // Event Edit
    response = await request(testEnv.expressServer.app)
      .patch(`/schedule/${scheduleIdMap.steve}/event/1242-000001`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send(eventEdit);
    expect(response.status).toBe(200);

    dbResponse = await testEnv.dbClient
      .container(SCHEDULE)
      .item(scheduleIdMap.steve)
      .read();
    schedule = dbResponse.resource;
    expect(
      schedule.eventList.filter(e => e.id === '1242-000001')[0].endTime
    ).toEqual({
      month: 4,
      day: 1,
      hour: 15,
      minute: 20,
    });

    eventEdit = {
      eventType: 'event',
      meetingDaysList: ['MONDAY'],
      startTime: {
        month: 4,
        day: 2,
        hour: 13,
        minute: 30,
      },
      endTime: {
        month: 5,
        day: 2,
        hour: 14,
        minute: 45,
      },
    };

    // Event Edit
    response = await request(testEnv.expressServer.app)
      .patch(`/schedule/${scheduleIdMap.steve}/event/1242-000001`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send(eventEdit);
    expect(response.status).toBe(200);

    dbResponse = await testEnv.dbClient
      .container(SCHEDULE)
      .item(scheduleIdMap.steve)
      .read();
    schedule = dbResponse.resource;
    expect(
      schedule.eventList.filter(e => e.id === '1242-000001')[0].endTime
    ).toEqual({
      month: 5,
      day: 2,
      hour: 14,
      minute: 45,
    });

    // Checking leap year
    eventEdit = {
      eventType: 'event',
      meetingDaysList: ['TUESDAY'],
      startTime: {
        month: 2,
        day: 29,
        hour: 14,
        minute: 46,
      },
      endTime: {
        month: 4,
        day: 1,
        hour: 15,
        minute: 20,
      },
    };

    // Event Edit
    response = await request(testEnv.expressServer.app)
      .patch(`/schedule/${scheduleIdMap.steve}/event/1242-000001`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send(eventEdit);
    expect(response.status).toBe(200);

    dbResponse = await testEnv.dbClient
      .container(SCHEDULE)
      .item(scheduleIdMap.steve)
      .read();
    schedule = dbResponse.resource;
    expect(
      schedule.eventList.filter(e => e.id === '1242-000001')[0].startTime
    ).toEqual({
      month: 2,
      day: 29,
      hour: 14,
      minute: 46,
    });
  });

  test('Success - Edit Session', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    const eventEdit = {
      eventType: 'session',
      sessionId: '1242-004289-36784',
      colorCode: 1,
    };

    // Event Edit
    const response = await request(testEnv.expressServer.app)
      .patch(`/schedule/${scheduleIdMap.steve}/event/1242-000003`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'})
      .send(eventEdit);
    expect(response.status).toBe(200);

    const dbResponse = await testEnv.dbClient
      .container(SCHEDULE)
      .item(scheduleIdMap.steve)
      .read();
    const schedule: Schedule = dbResponse.resource;
    expect(
      schedule.sessionList.filter(e => e.id === '1242-004289-36784')[0]
        .colorCode
    ).toEqual(1);

    //TODO - Add more test cases for session edit and check db
  });
});
