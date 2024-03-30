/**
 * Jest unit test for GET /schedule/{base64Email}/list method
 *
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

import * as request from 'supertest';
import * as jwt from 'jsonwebtoken';
import * as Cosmos from '@azure/cosmos';
import TestEnv from '../../TestEnv';
import ExpressServer from '../../../src/ExpressServer';
import AuthToken from '../../../src/datatypes/Token/AuthToken';
import TestConfig from '../../TestConfig';

describe('GET /schedule/{base64Email}/list - get Schedule List', () => {
  let testEnv: TestEnv;

  const encodedEmailMap = {
    steve: Buffer.from('steve@wisc.edu', 'utf8').toString('base64url'),
    drag: Buffer.from('drag@wisc.edu', 'utf8').toString('base64url'),
    park: Buffer.from('park@wisc.edu', 'utf8').toString('base64url'),
  };

  const accessTokenMap = {
    park: '',
    steve: '',
    drag: '',
    refresh: '',
    expired: '',
    admin: '',
  };

  const scheduleListMap = {
    drag: [
      TestConfig.hash(
        `${'drag@wisc.edu'}/${'1244'}/${'2021-04-01T00:00:00.000Z'}`,
        'drag@wisc.edu',
        '1244'
      ),
      TestConfig.hash(
        `${'drag@wisc.edu'}/${'1242'}/${'2021-04-01T00:00:00.000Z'}`,
        'drag@wisc.edu',
        '1242'
      ),
    ],
    steve: [
      TestConfig.hash(
        `${'steve@wisc.edu'}/${'1242'}/${'2021-04-01T00:00:00.000Z'}`,
        'steve@wisc.edu',
        '1242'
      ),
    ],
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
  });

  afterEach(async () => {
    await testEnv.stop();
  });

  test('Fail - No Access Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    // reqeust without a token
    const response = await request(testEnv.expressServer.app)
      .get(`/schedule/${encodedEmailMap.steve}/list`)
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
      .get(`/schedule/${encodedEmailMap.steve}/list`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.expired})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Wrong Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // reqeust with admin token
    let response = await request(testEnv.expressServer.app)
      .get(`/schedule/${encodedEmailMap.steve}/list`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.admin})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // request with refresh token
    response = await request(testEnv.expressServer.app)
      .get(`/schedule/${encodedEmailMap.steve}/list`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.refresh})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // request with "wrong" token
    response = await request(testEnv.expressServer.app)
      .get(`/schedule/${encodedEmailMap.steve}/list`)
      .set({'X-ACCESS-TOKEN': 'wrong'})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Not from Origin nor App', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // request without any origin or app
    let response = await request(testEnv.expressServer.app)
      .get(`/schedule/${encodedEmailMap.steve}/list`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // request without from wrong origin and not app
    response = await request(testEnv.expressServer.app)
      .get(`/schedule/${encodedEmailMap.steve}/list`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://wrong.origin.com'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // request without from wrong app
    response = await request(testEnv.expressServer.app)
      .get(`/schedule/${encodedEmailMap.steve}/list`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({'X-APPLICATION-KEY': 'wrongAppKey'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Schedule does not exist', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // request with a valid email but no schedule
    const response = await request(testEnv.expressServer.app)
      .get(`/schedule/${encodedEmailMap.park}/list`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.park})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not Found');
  });

  test('Fail - Invalid Email', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // request with a invalid email
    const response = await request(testEnv.expressServer.app)
      .get('/schedule/invalid/list')
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not Found');
  });

  test('Fail - Not Friend of Schedule Owner', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // request with a invalid email
    const response = await request(testEnv.expressServer.app)
      .get(`/schedule/${encodedEmailMap.steve}/list`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.park})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Success from web', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // request with a valid email
    let response = await request(testEnv.expressServer.app)
      .get(`/schedule/${encodedEmailMap.drag}/list`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.drag})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(200);
    expect(response.body).toEqual(scheduleListMap.drag);

    response = await request(testEnv.expressServer.app)
      .get(`/schedule/${encodedEmailMap.drag}/list`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(200);
    expect(response.body).toEqual(scheduleListMap.drag);

    response = await request(testEnv.expressServer.app)
      .get(`/schedule/${encodedEmailMap.steve}/list`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.drag})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(200);
    expect(response.body).toEqual(scheduleListMap.steve);
  });

  test('Success from app', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // request with a valid email
    let response = await request(testEnv.expressServer.app)
      .get(`/schedule/${encodedEmailMap.drag}/list`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.drag})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'});
    expect(response.status).toBe(200);
    expect(response.body).toEqual(scheduleListMap.drag);

    response = await request(testEnv.expressServer.app)
      .get(`/schedule/${encodedEmailMap.drag}/list`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'});
    expect(response.status).toBe(200);
    expect(response.body).toEqual(scheduleListMap.drag);

    response = await request(testEnv.expressServer.app)
      .get(`/schedule/${encodedEmailMap.steve}/list`)
      .set({'X-ACCESS-TOKEN': accessTokenMap.drag})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'});
    expect(response.status).toBe(200);
    expect(response.body).toEqual(scheduleListMap.steve);
  });
});
