/**
 * Jest Unit Test for POST /schedule method
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

describe('POST /schedule - Create a New Schedule', () => {
  let testEnv: TestEnv;
  const SCHEDULE = 'schedule';
  const accessTokenMap = {
    steve: '',
    drag: '',
    refresh: '',
    expired: '',
    admin: '',
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
  });

  afterEach(async () => {
    await testEnv.stop();
  });

  test('Fail - No Access Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // reqeust without a token
    const response = await request(testEnv.expressServer.app)
      .post('/schedule')
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthenticated');
  });

  test('Fail - Expired Access Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Wait for 5 ms
    await new Promise(resolve => setTimeout(resolve, 5));

    // request with an expired access token from web
    const response = await request(testEnv.expressServer.app)
      .post('/schedule')
      .set({'X-ACCESS-TOKEN': accessTokenMap.expired})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Wrong Token', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // reqeust with admin token
    let response = await request(testEnv.expressServer.app)
      .post('/schedule')
      .set({'X-ACCESS-TOKEN': accessTokenMap.admin})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // request with refresh token
    response = await request(testEnv.expressServer.app)
      .post('/schedule')
      .set({'X-ACCESS-TOKEN': accessTokenMap.refresh})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // request with "wrong" token
    response = await request(testEnv.expressServer.app)
      .post('/schedule')
      .set({'X-ACCESS-TOKEN': 'wrong'})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Not from Origin nor App', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // request without any origin or app
    let response = await request(testEnv.expressServer.app)
      .post('/schedule')
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // request without from wrong origin and not app
    response = await request(testEnv.expressServer.app)
      .post('/schedule')
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://wrong.origin.com'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // request without from wrong app
    response = await request(testEnv.expressServer.app)
      .post('/schedule')
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({'X-APPLICATION-KEY': 'wrongAppKey'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Bad Request', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // request with no request body
    let response = await request(testEnv.expressServer.app)
      .post('/schedule')
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');

    // request with invalid request body property
    response = await request(testEnv.expressServer.app)
      .post('/schedule')
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send({invalidPropertity: 'invalidValue'});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');

    // request with extra request body property
    response = await request(testEnv.expressServer.app)
      .post('/schedule')
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send({
        invalidPropertity: 'invalidValue',
        termCode: '1244',
      });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');

    // request with inexistent termCode
    response = await request(testEnv.expressServer.app)
      .post('/schedule')
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send({termCode: '1224'});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');
  });

  test('Fail - Schedule with TermCode Exists', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // request with a termCode that already exists
    let response = await request(testEnv.expressServer.app)
      .post('/schedule')
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send({termCode: '1242'});
    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Conflict');

    // request with a termCode that already exists
    response = await request(testEnv.expressServer.app)
      .post('/schedule')
      .set({'X-ACCESS-TOKEN': accessTokenMap.drag})
      .set({Origin: 'https://collegemate.app'})
      .send({termCode: '1244'});
    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Conflict');
  });

  test('Success from web', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // valid request from web - Steve
    let response = await request(testEnv.expressServer.app)
      .post('/schedule')
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({Origin: 'https://collegemate.app'})
      .send({termCode: '1244'});
    expect(response.status).toBe(201);
    expect(response.body.scheduleId).toBeDefined();

    //check if the schedule is created
    let dbOps = await testEnv.dbClient
      .container(SCHEDULE)
      .item(response.body.scheduleId)
      .read();
    expect(dbOps.statusCode).toBe(200);

    // valid request from web - Drag
    response = await request(testEnv.expressServer.app)
      .post('/schedule')
      .set({'X-ACCESS-TOKEN': accessTokenMap.drag})
      .set({Origin: 'https://collegemate.app'})
      .send({termCode: '1242'});
    expect(response.status).toBe(201);
    expect(response.body.scheduleId).toBeDefined();

    // check if the schedule is created
    dbOps = await testEnv.dbClient
      .container(SCHEDULE)
      .item(response.body.scheduleId)
      .read();
  });

  test('Success from app', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // valid request from app - Steve
    let response = await request(testEnv.expressServer.app)
      .post('/schedule')
      .set({'X-ACCESS-TOKEN': accessTokenMap.steve})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'})
      .send({termCode: '1244'});
    expect(response.status).toBe(201);
    expect(response.body.scheduleId).toBeDefined();

    // check if the schedule is created
    let dbOps = await testEnv.dbClient
      .container(SCHEDULE)
      .item(response.body.scheduleId)
      .read();
    expect(dbOps.statusCode).toBe(200);

    // Drag with another termCode
    response = await request(testEnv.expressServer.app)
      .post('/schedule')
      .set({'X-ACCESS-TOKEN': accessTokenMap.drag})
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'})
      .send({termCode: '1242'});
    expect(response.status).toBe(201);
    expect(response.body.scheduleId).toBeDefined();

    // check if the schedule is created
    dbOps = await testEnv.dbClient
      .container(SCHEDULE)
      .item(response.body.scheduleId)
      .read();
    expect(dbOps.statusCode).toBe(200);
  });
});
