/**
 * Jest Unit test for GET /schedule/course method
 *
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

// eslint-disable-next-line node/no-unpublished-import
import * as request from 'supertest';
import * as Cosmos from '@azure/cosmos';
import TestEnv from '../../TestEnv';
import ExpressServer from '../../../src/ExpressServer';

describe('GET /schedule/course - Course Search', () => {
  let testEnv: TestEnv;

  beforeEach(async () => {
    testEnv = new TestEnv(expect.getState().currentTestName as string);
    // Start Test Environment
    await testEnv.start();
  });

  afterEach(async () => {
    await testEnv.stop();
  });

  test('Fail - Neither from Origin or App', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Wrong Origin
    let response = await request(testEnv.expressServer.app)
      .get('/schedule/course')
      .set({Origin: 'https://suspicious.app'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Wrong App Version
    response = await request(testEnv.expressServer.app)
      .get('/schedule/course')
      .set({'X-APPLICATION-KEY': '<Android-App-v2>'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // No Origin
    response = await request(testEnv.expressServer.app).get('/schedule/course');
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Bad Request', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Without request body
    let response = await request(testEnv.expressServer.app)
      .get('/schedule/course')
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');

    // Request with invalid request body property
    response = await request(testEnv.expressServer.app)
      .get('/schedule/course')
      .set({Origin: 'https://collegemate.app'})
      .send({
        invalidPropertity: 'invalidValue',
        invalidProperty2: 'invalidValue2',
      });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');

    // Request with invalid request body input(termCode)
    response = await request(testEnv.expressServer.app)
      .get('/schedule/course')
      .set({Origin: 'https://collegemate.app'})
      .send({
        termCode: '0000',
        courseName: 'BSE 1',
      });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');
  });

  test('Success', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Request From Web
    let response = await request(testEnv.expressServer.app)
      .get('/schedule/course')
      .set({Origin: 'https://collegemate.app'})
      .send({
        termCode: '1242',
        courseName: 'BSE 1',
      });
    expect(response.status).toBe(200);
    expect(response.body.found).toBe(true);
    expect(response.body.result.courseId).toBe('000441');
    expect(response.body.result.fullCourseName).toBe(
      'BIOLOGICAL SYSTEMS ENGINEERING 1'
    );
    expect(response.body.result.sessionList.length).toBe(3);
    expect(response.body.result.sessionList[0].id).toBe('1242-000441-32924');
    expect(response.body.result.sessionList[1].sessionId).toBe('32807');
    expect(response.body.result.sessionList[2].isAsynchronous).toBe(true);

    // Request From Web
    response = await request(testEnv.expressServer.app)
      .get('/schedule/course')
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'})
      .send({
        termCode: '1244',
        courseName: 'ANTHROPOLOGY 102',
      });
    expect(response.status).toBe(200);
    expect(response.body.found).toBe(true);
    expect(response.body.result.courseId).toBe('000803');
    expect(response.body.result.fullCourseName).toBe('ANTHROPOLOGY 102');
    expect(response.body.result.sessionList.length).toBe(8);
    expect(response.body.result.sessionList[0].id).toBe('1244-000803-64830');
    expect(response.body.result.sessionList[0].meetings.length).toBe(3);
    expect(response.body.result.sessionList[0].meetings[0].buildingName).toBe(
      'Sewell Social Sciences'
    );
    expect(response.body.result.sessionList[1].sessionId).toBe('64829');
    expect(response.body.result.sessionList[2].isAsynchronous).toBe(false);
  });
});
