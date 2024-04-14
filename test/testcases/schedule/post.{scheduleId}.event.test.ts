/**
 * Jest Unit Test for POST /schedule/:scheduleId/event
 *
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

// eslint-disable-next-line node/no-unpublished-import
import * as request from 'supertest';
import * as Cosmos from '@azure/cosmos';
import TestEnv from '../../TestEnv';
import ExpressServer from '../../../src/ExpressServer';
import AuthToken from '../../../src/datatypes/Token/AuthToken';
import * as jwt from 'jsonwebtoken';
import TestConfig from '../../TestConfig';
import ServerConfig from '../../../src/ServerConfig';

describe('POST /schedule/:scheduleId/event - Add Event/Session', () => {
    let testEnv: TestEnv;
    const SCHEDULE = 'schedule';
    const accessTokenMap = {
      steve: '',
      drag: '',
      refresh: '',
      expired: '',
      admin: '',
    };  
    const scheduleIdMap = {
      steve: '',
      drag: '',
      invalid: 'invalid',
    };
    const eventMap = {
      validEvent: {},
      overlapEvent: {},
      validSession: {},
      overlapSession: {},
      invalid: {},
      doesNotExistSession: {},
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
  
      // event1
      eventMap.validEvent = {
        eventType: 'event',
        title: 'event1',
        location: 'location1',
        meetingDaysList: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
        startTime: {
          month: 1,
          day: 1,
          hour: 10,
          minute: 0,
        },
        endTime: {
          month: 5,
          day: 31,
          hour: 11,
          minute: 0,
        },
        memo: 'memo1',
        colorCode: 1,
      };
  
      // overlap event
      eventMap.overlapEvent = {
        eventType: 'event',
        id: '1242-000001',
        title: 'Birthday',
        location: 'Online',
        meetingDaysList: ['Monday', 'Wednesday'],
        startTime: {
          month: 4,
          day: 1,
          hour: 9,
          minute: 30,
        },
        endTime: {
          month: 4,
          day: 1,
          hour: 10,
          minute: 45,
        },
        memo: 'Test Event 1',
        colorCode: 0,
      };

      eventMap.invalid = {invalid: 'invalid'};

      eventMap.validSession = {
        eventType: 'session',
        sessionId: '1242-004289-36784',
        memo: 'memo1',
        colorCode: 1,
      };

      eventMap.overlapSession = {
        eventType: 'session',
        id: '1242-000003',
        colorCode: 0,
      };

      eventMap.doesNotExistSession = {
        id: '1242-999999',
        colorCode: 0,
      };
    });
  
    afterEach(async () => {
      await testEnv.stop();
    });
  
    test('Fail - No Access Token', async () => {
      testEnv.expressServer = testEnv.expressServer as ExpressServer;
  
      // reqeust without a token
      const response = await request(testEnv.expressServer.app)
        .post(`/schedule/${scheduleIdMap.steve}/event`)
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
        .post(`/schedule/${scheduleIdMap.steve}/event`)
        .set({'X-ACCESS-TOKEN': accessTokenMap.expired})
        .set({Origin: 'https://collegemate.app'});
      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden');
    });
  
    test('Fail - Wrong Token', async () => {
      testEnv.expressServer = testEnv.expressServer as ExpressServer;
  
      // reqeust with admin token
      let response = await request(testEnv.expressServer.app)
        .post(`/schedule/${scheduleIdMap.steve}/event`)
        .set({'X-ACCESS-TOKEN': accessTokenMap.admin})
        .set({Origin: 'https://collegemate.app'});
      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden');
  
      // request with refresh token
      response = await request(testEnv.expressServer.app)
        .delete(`/schedule/${scheduleIdMap.steve}/event`)
        .set({'X-ACCESS-TOKEN': accessTokenMap.refresh})
        .set({Origin: 'https://collegemate.app'});
      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden');
  
      // request with "wrong" token
      response = await request(testEnv.expressServer.app)
        .delete(`/schedule/${scheduleIdMap.steve}/event`)
        .set({'X-ACCESS-TOKEN': 'wrong'})
        .set({Origin: 'https://collegemate.app'});
      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden');
    });
  
    test('Fail - Not from Origin nor App', async () => {
      testEnv.expressServer = testEnv.expressServer as ExpressServer;
  
      // request without any origin or app
      let response = await request(testEnv.expressServer.app)
        .post(`/schedule/${scheduleIdMap.steve}/event`)
        .set({'X-ACCESS-TOKEN': accessTokenMap.steve});
      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden');
  
      // request without from wrong origin and not app
      response = await request(testEnv.expressServer.app)
        .post(`/schedule/${scheduleIdMap.steve}/event`)
        .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
        .set({Origin: 'https://wrong.origin.com'});
      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden');
  
      // request without from wrong app
      response = await request(testEnv.expressServer.app)
        .post(`/schedule/${scheduleIdMap.steve}/event`)
        .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
        .set({'X-APPLICATION-KEY': 'wrongAppKey'});
      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden');
    });
  
    test('Fail - Schedule does not exist', async () => {
      testEnv.expressServer = testEnv.expressServer as ExpressServer;
      testEnv.dbClient = testEnv.dbClient as Cosmos.Database;
  
      // request with a invalid scheduleId
      let response = await request(testEnv.expressServer.app)
        .post(`/schedule/${scheduleIdMap.invalid}/event`)
        .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
        .set({Origin: 'https://collegemate.app'})
        .send(eventMap.validEvent);
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not Found');
  
      // request with another invalid scheduleId
      response = await request(testEnv.expressServer.app)
        .post('/schedule/1111/event')
        .set({'X-ACCESS-TOKEN': accessTokenMap.drag})
        .set({Origin: 'https://collegemate.app'})
        .send(eventMap.validSession);
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not Found');
    });
  
    test('Fail - User is not the owner of the Schedule', async () => {
      testEnv.expressServer = testEnv.expressServer as ExpressServer;
      testEnv.dbClient = testEnv.dbClient as Cosmos.Database;
  
      // Steve tries to delete Drag's schedule
      let response = await request(testEnv.expressServer.app)
        .post(`/schedule/${scheduleIdMap.drag}/event`)
        .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
        .set({Origin: 'https://collegemate.app'})
        .send(eventMap.validEvent);
      expect(response.status).toBe(403);
  
      // Drag tries to delete Steve's schedule
      response = await request(testEnv.expressServer.app)
        .post(`/schedule/${scheduleIdMap.steve}/event`)
        .set({'X-ACCESS-TOKEN': accessTokenMap.drag})
        .set({Origin: 'https://collegemate.app'})
        .send(eventMap.validSession);
      expect(response.status).toBe(403);
    });

    test('Fail - Session/Event with conflicting schedule', async () => {
        testEnv.expressServer = testEnv.expressServer as ExpressServer;
        testEnv.dbClient = testEnv.dbClient as Cosmos.Database;
    
        // Steve tries to add an event with overlapping schedule
        let response = await request(testEnv.expressServer.app)
            .post(`/schedule/${scheduleIdMap.steve}/event`)
            .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
            .set({Origin: 'https://collegemate.app'})
            .send(eventMap.overlapEvent);
        expect(response.status).toBe(409);
        expect(response.body.error).toBe('Conflict');

        response = await request(testEnv.expressServer.app)
            .post(`/schedule/${scheduleIdMap.steve}/event`)
            .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
            .set({Origin: 'https://collegemate.app'})
            .send(eventMap.overlapSession);
        expect(response.status).toBe(409);
        expect(response.body.error).toBe('Conflict');
    });

    test('Fail - Add Session which does not exist in DB', async () => {
        testEnv.expressServer = testEnv.expressServer as ExpressServer;
        testEnv.dbClient = testEnv.dbClient as Cosmos.Database;
    
        // Steve tries to add an event with overlapping schedule
        let response = await request(testEnv.expressServer.app)
            .post(`/schedule/${scheduleIdMap.steve}/event`)
            .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
            .set({Origin: 'https://collegemate.app'})
            .send(eventMap.doesNotExistSession);
        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Not Found');
    });

    test('Fail - Invalid Request Body', async () => {
        testEnv.expressServer = testEnv.expressServer as ExpressServer;
        testEnv.dbClient = testEnv.dbClient as Cosmos.Database;
    
        // Steve tries to add an event with invalid request body
        let response = await request(testEnv.expressServer.app)
            .post(`/schedule/${scheduleIdMap.steve}/event`)
            .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
            .set({Origin: 'https://collegemate.app'})
            .send(eventMap.invalid);
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Bad Request');
    });

    test('Success - Add Event/Session from Web', async () => {
        testEnv.expressServer = testEnv.expressServer as ExpressServer;
        testEnv.dbClient = testEnv.dbClient as Cosmos.Database;
    
        // Steve tries to add an event
        let response = await request(testEnv.expressServer.app)
            .post(`/schedule/${scheduleIdMap.steve}/event`)
            .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
            .set({Origin: 'https://collegemate.app'})
            .send(eventMap.validEvent);
        expect(response.status).toBe(201);

        // Steve tries to add a session
        response = await request(testEnv.expressServer.app)
            .post(`/schedule/${scheduleIdMap.steve}/event`)
            .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
            .set({Origin: 'https://collegemate.app'})
            .send(eventMap.validSession);
        expect(response.status).toBe(201);
        // TODO: Check hash logic for eventId and write tests
    });
  });